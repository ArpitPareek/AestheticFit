// supabase/functions/parse-meal/index.ts
//
// F2 -- Free-text meal parsing. SINGLE SELF-CONTAINED FILE: deployed by pasting
// into the Supabase dashboard function editor, so JWT auth, CORS, and rate
// limiting are inlined here rather than imported from _shared/ (those stay as
// reference only for functions that ARE deployed via CLI/git).
//
// POST { text: string, userId: string }
// Authorization: Bearer <user session JWT>
//
// Flow:
//   1. authenticate (401 on missing/invalid token, or userId mismatch)
//   2. rate limit 30/min per user (429 over limit)
//   3. call Groq for structured extraction, 4s timeout
//   4. on Groq timeout/error/429 -> fall back to Gemini Flash if GEMINI_API_KEY
//      is set (4s timeout); if not set, skip straight to the manual-entry signal
//   5. if every provider fails -> return a structured manual-entry response
//      (200, never a 500 -- a parsing outage must never block logging)
//   6. resolve each parsed item against food_library (exact + trigram fuzzy via
//      match_food_fuzzy RPC) + food_aliases + portion_conversions; compute
//      macros FROM THE DB, never from the model's own numbers, for anything
//      that resolves
//   7. items the DB can't resolve fall back to the model's own per-100g
//      estimate (requested up front in the same extraction call -- see
//      SYSTEM_PROMPT -- so no second AI round trip is needed), marked
//      source:'ai_estimated' and listed in `warnings`; the estimate is cached
//      into ai_food_estimates (dedup by normalized_name) so the next mention
//      of the same food resolves from the DB instead of asking the AI again.
//
// Never logs the API key or the full user-supplied text -- only short error
// codes/messages from providers.

import { createClient } from 'jsr:@supabase/supabase-js@2'

// -- CORS (inlined; mirrors _shared/cors.ts) ----------------------------------
const ALLOWED_ORIGINS = new Set([
  'https://aesthetic-fit-one.vercel.app',
  'http://localhost:5173',
  'http://localhost:4173',
])

function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = origin && ALLOWED_ORIGINS.has(origin) ? origin : ALLOWED_ORIGINS.values().next().value
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  }
}

function json(status: number, body: unknown, extra: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...extra },
  })
}

// -- env ----------------------------------------------------------------------
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY')
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') // optional -- fallback unavailable if unset
// Model must reliably honour response_format:json_object with a NESTED schema
// (items[].ingredients[]). `openai/gpt-oss-20b` is a reasoning model that fails
// Groq's strict JSON validation on the nested output (json_validate_failed);
// llama-3.3-70b-versatile handles it cleanly. Env-overridable so a future model
// rename needs no code edit — but any override MUST support strict json_object.
const GROQ_MODEL = Deno.env.get('GROQ_MODEL') || 'llama-3.3-70b-versatile'
const GEMINI_MODEL = Deno.env.get('GEMINI_MODEL') || 'gemini-2.0-flash'

const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// -- types --------------------------------------------------------------------
type Macros = { calories: number; protein_g: number; carbs_g: number; fat_g: number; fiber_g: number }

type Ingredient = { name: string; grams: number }

type AiItem = {
  name: string
  quantity: number
  unit: string
  estimated_grams: number
  estimate_per_100g: Macros
  // Present for cooked/composite dishes: the raw components (for the TOTAL amount
  // described) so we can compute macros from the DB instead of trusting a guess.
  ingredients: Ingredient[]
}

// One resolved component of a composed dish — carries its own macros so the
// client can re-scale it when the user edits its grams, no server round-trip.
type ResolvedIngredient = { name: string; grams: number } & Macros

type ResolvedItem = {
  name: string
  quantity: number
  unit: string
  matched_food_id: string | null
  matched_name: string | null
  grams: number
  source: 'library' | 'fuzzy' | 'ai_estimated' | 'composed'
  ingredients?: ResolvedIngredient[]
} & Macros

// -- inlined auth (mirrors _shared/auth.ts) -----------------------------------
async function authenticate(req: Request): Promise<{ id: string } | null> {
  const authHeader = req.headers.get('Authorization') ?? ''
  if (!authHeader.startsWith('Bearer ')) return null
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data, error } = await client.auth.getUser()
  if (error || !data.user) return null
  return { id: data.user.id }
}

// -- inlined rate limit (mirrors _shared/rateLimit.ts) ------------------------
async function checkRateLimit(userId: string): Promise<{ allowed: boolean; remaining: number }> {
  const { data, error } = await serviceClient.rpc('check_rate_limit_fn', {
    p_user_id: userId,
    p_bucket: 'parse-meal',
    p_limit: 30,
    p_window_seconds: 60,
  })
  if (error) {
    console.error('rate_limit_rpc_error', error.message)
    return { allowed: true, remaining: 30 } // fail-open on infra errors
  }
  const row = Array.isArray(data) ? data[0] : data
  return { allowed: row?.allowed ?? true, remaining: row?.remaining ?? 0 }
}

// -- AI extraction ------------------------------------------------------------
const SYSTEM_PROMPT = `You extract food items from a casual meal description (often Indian home food, mixed English/Hindi).

Return ONLY a JSON object of the exact shape:
{"items":[{"name":string,"quantity":number,"unit":string,"estimated_grams":number,"estimate_per_100g":{"calories":number,"protein_g":number,"carbs_g":number,"fat_g":number,"fiber_g":number},"ingredients":[{"name":string,"grams":number}]}]}

Rules:
- Extract EVERY food and drink the user mentions as its OWN separate item. Never merge two foods into one, and never omit one (e.g. "2 paratha and 1 chai" MUST return two items).
- "name": the food's common name (e.g. "toor dal", "roti", "paneer tikka").
- "quantity": the number of "unit"s mentioned (default 1 if not stated).
- "unit": one of piece, katori, small_katori, plate, glass, cup, tbsp, tsp, g, kg, ml -- pick the closest one; if grams/ml are stated use those directly.
- PORTION DEFAULTS -- when the amount is vague or unstated, assume ONE realistic
  adult serving, never a tiny count. Guidance:
    * bare food name, no amount -> quantity 1 of its natural serving unit
      (dal/sabzi/rice -> 1 katori; roti/egg/idli/fruit -> 1 piece; milk/juice/
      tea/coffee/shake -> 1 glass; oil/ghee/butter/peanut butter -> 1 tsp).
    * "handful" of nuts/snacks -> ~20 g (NOT a few pieces).
    * "bowl" -> katori; "small bowl" -> small_katori; "plate" -> plate.
    * a glass ~250 ml, a katori ~150 g, a cup ~150 ml, a tbsp ~15 g, a tsp ~5 g.
  Prefer household units (katori/plate/glass/piece) over raw grams unless the
  user actually stated grams/ml.
- "estimated_grams": your best-guess TOTAL grams for this line item (quantity * typical serving weight), consistent with the portion defaults above.
- "estimate_per_100g": your best-guess macros per 100g of this food, ALWAYS include this even if you are confident the food is a well-known one -- it's used only as a fallback. Keep these realistic: per 100 g, calories 0-900, protein/carbs/fat/fibre each 0-100, and calories must roughly equal 4*protein + 4*carbs + 9*fat.
- "ingredients": for a COOKED/COMPOSITE dish (dal, sabzi, curry, biryani, poha, shake, sandwich, paratha, etc.) list its main RAW components with grams, using DRY weights for staples (flour, dal, rice) and simple names our DB knows ("wheat flour","toor dal","rice","onion","cooking oil","milk","sugar","paneer","potato"). Include cooking oil/ghee. Use realistic home amounts, do NOT inflate: e.g. 1 roti ~30g flour +1g oil; 1 paratha ~45g flour +6g oil (stuffed: +40g filling); 1 katori dal ~30g dry dal +5g oil; 1 katori sabzi ~120g veg +7g oil; 1 katori rice ~50g raw rice; 1 cup chai ~120ml milk +8g sugar. For a single whole food (apple, boiled egg, plain milk, nuts) use [].
- No prose, no markdown, no extra keys. If you cannot identify any food, return {"items":[]}.`

class ProviderError extends Error {}

function withTimeout(ms: number): { signal: AbortSignal; cancel: () => void } {
  const controller = new AbortController()
  const t = setTimeout(() => controller.abort(), ms)
  return { signal: controller.signal, cancel: () => clearTimeout(t) }
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n))

// Reject physically-impossible per-100g macros and reconcile calories with the
// Atwater sum (4/4/9). Prevents a hallucinated "900 cal, 80 g protein" from
// being logged or cached.
function sanitizePer100g(m: Macros): { macros: Macros; adjusted: boolean } {
  const protein_g = clamp(Number(m.protein_g) || 0, 0, 100)
  const carbs_g = clamp(Number(m.carbs_g) || 0, 0, 100)
  const fat_g = clamp(Number(m.fat_g) || 0, 0, 100)
  const fiber_g = clamp(Number(m.fiber_g) || 0, 0, 100)
  const atwater = 4 * protein_g + 4 * carbs_g + 9 * fat_g
  let calories = clamp(Number(m.calories) || 0, 0, 900)
  // If the model's calories disagree with the macro sum by >25% (and the sum is
  // meaningful), trust the Atwater calculation — it's internally consistent.
  const adjusted =
    atwater > 20 && Math.abs(calories - atwater) / atwater > 0.25
  if (adjusted) calories = Math.round(atwater)
  return { macros: { calories, protein_g, carbs_g, fat_g, fiber_g }, adjusted }
}

function parseIngredients(raw: unknown): Ingredient[] {
  if (!Array.isArray(raw)) return []
  const out: Ingredient[] = []
  for (const ing of raw) {
    const name = typeof ing?.name === 'string' ? ing.name.trim() : ''
    const grams = Number(ing?.grams)
    if (name && Number.isFinite(grams) && grams > 0) {
      out.push({ name, grams: clamp(grams, 1, 2000) })
    }
  }
  return out
}

function parseAiItems(raw: string | undefined | null): AiItem[] | null {
  if (!raw) return null
  try {
    const obj = JSON.parse(raw)
    if (!obj || !Array.isArray(obj.items)) return null
    const items: AiItem[] = []
    for (const it of obj.items) {
      if (typeof it?.name !== 'string' || !it.name.trim()) continue
      const est = it.estimate_per_100g ?? {}
      const { macros } = sanitizePer100g({
        calories: Number(est.calories) || 0,
        protein_g: Number(est.protein_g) || 0,
        carbs_g: Number(est.carbs_g) || 0,
        fat_g: Number(est.fat_g) || 0,
        fiber_g: Number(est.fiber_g) || 0,
      })
      items.push({
        name: it.name.trim(),
        quantity: Number.isFinite(it.quantity) ? Number(it.quantity) : 1,
        unit: typeof it.unit === 'string' && it.unit.trim() ? it.unit.trim().toLowerCase() : 'piece',
        estimated_grams: Number.isFinite(it.estimated_grams) ? clamp(Number(it.estimated_grams), 1, 2000) : 100,
        estimate_per_100g: macros,
        ingredients: parseIngredients(it.ingredients),
      })
    }
    return items
  } catch {
    return null
  }
}

// Groq is the sole provider (no Gemini fallback configured), so give it a
// generous timeout — a slow-but-valid response on cold start shouldn't be
// killed into a manual-entry fallback. Override with GROQ_TIMEOUT_MS if needed.
const GROQ_TIMEOUT_MS = Number(Deno.env.get('GROQ_TIMEOUT_MS')) || 9000

async function callGroq(text: string): Promise<AiItem[] | null> {
  if (!GROQ_API_KEY) throw new ProviderError('groq_not_configured')
  const { signal, cancel } = withTimeout(GROQ_TIMEOUT_MS)
  try {
    const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: GROQ_MODEL,
        temperature: 0,
        // Nested ingredient output for a multi-item meal can be long; give it
        // headroom so the JSON is never cut off mid-structure.
        max_tokens: 2048,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: text },
        ],
      }),
      signal,
    })
    if (resp.status === 429) throw new ProviderError('groq_rate_limited')
    if (!resp.ok) {
      // Capture the provider's error message (truncated) — a bare status code
      // hides whether it's a bad model, unsupported json_mode, etc.
      let detail = ''
      try { detail = (await resp.text()).slice(0, 300).replace(/\s+/g, ' ') } catch { /* ignore */ }
      throw new ProviderError(`groq_http_${resp.status}:${detail}`)
    }
    const data = await resp.json()
    const items = parseAiItems(data?.choices?.[0]?.message?.content)
    if (items === null) throw new ProviderError('groq_bad_json')
    return items
  } finally {
    cancel()
  }
}

async function callGemini(text: string): Promise<AiItem[] | null> {
  if (!GEMINI_API_KEY) throw new ProviderError('gemini_not_configured')
  const { signal, cancel } = withTimeout(4000)
  try {
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${SYSTEM_PROMPT}\n\nUser text: ${text}` }] }],
          generationConfig: { temperature: 0, responseMimeType: 'application/json' },
        }),
        signal,
      },
    )
    if (!resp.ok) throw new ProviderError(`gemini_http_${resp.status}`)
    const data = await resp.json()
    const items = parseAiItems(data?.candidates?.[0]?.content?.parts?.[0]?.text)
    if (items === null) throw new ProviderError('gemini_bad_json')
    return items
  } finally {
    cancel()
  }
}

async function extractItems(text: string): Promise<{ items: AiItem[] | null; providerFailed: string[] }> {
  const providerFailed: string[] = []
  try {
    return { items: await callGroq(text), providerFailed }
  } catch (e) {
    providerFailed.push(e instanceof Error ? e.message : 'groq_unknown_error')
  }
  try {
    return { items: await callGemini(text), providerFailed }
  } catch (e) {
    providerFailed.push(e instanceof Error ? e.message : 'gemini_unknown_error')
  }
  return { items: null, providerFailed }
}

// -- unit normalization / grams resolution ------------------------------------
const UNIT_ALIASES: Record<string, string> = {
  pieces: 'piece', pcs: 'piece', pc: 'piece',
  bowl: 'katori', bowls: 'katori', katoris: 'katori',
  'small bowl': 'small_katori', 'small_katoris': 'small_katori',
  plates: 'plate', glasses: 'glass', cups: 'cup',
  gram: 'g', grams: 'g', gm: 'g', gms: 'g',
  kilogram: 'kg', kilograms: 'kg',
  milliliter: 'ml', millilitre: 'ml', milliliters: 'ml',
}
const normalizeUnit = (u: string): string => UNIT_ALIASES[u.toLowerCase().trim()] ?? u.toLowerCase().trim()
const normalizeName = (s: string): string => s.trim().toLowerCase().replace(/\s+/g, ' ')

async function gramsForMatchedFood(
  foodId: string,
  servingGrams: number,
  unit: string,
  quantity: number,
  fallbackGrams: number,
): Promise<{ grams: number; usedDefaultServing: boolean }> {
  const u = normalizeUnit(unit)
  if (u === 'g') return { grams: quantity, usedDefaultServing: false }
  if (u === 'kg') return { grams: quantity * 1000, usedDefaultServing: false }
  if (u === 'ml') return { grams: quantity, usedDefaultServing: false } // approximation for liquids

  const { data } = await serviceClient
    .from('portion_conversions')
    .select('grams_equivalent')
    .eq('food_id', foodId)
    .eq('unit', u)
    .maybeSingle()
  if (data) return { grams: quantity * Number(data.grams_equivalent), usedDefaultServing: false }

  // No calibrated portion for this unit -- fall back to the food's own default
  // serving size scaled by quantity, or the AI's grams estimate if that's more
  // plausible (guards against e.g. quantity=1 unit="plate" on a 35g roti food).
  const viaDefaultServing = quantity * servingGrams
  const grams = viaDefaultServing > 0 ? viaDefaultServing : fallbackGrams
  return { grams, usedDefaultServing: true }
}

function scaleMacros(per: Macros, perGrams: number, grams: number): Macros {
  const mult = perGrams > 0 ? grams / perGrams : 0
  const round1 = (n: number) => Math.round(n * 10) / 10
  return {
    calories: round1(per.calories * mult),
    protein_g: round1(per.protein_g * mult),
    carbs_g: round1(per.carbs_g * mult),
    fat_g: round1(per.fat_g * mult),
    fiber_g: round1(per.fiber_g * mult),
  }
}

// -- DB resolution -------------------------------------------------------------
const FUZZY_MIN_SIMILARITY = 0.3 // matches the `%` operator's own threshold; anything returned already clears this

type FoodRow = {
  id: string; name: string; serving_grams: number
  calories: number; protein_g: number; carbs_g: number; fat_g: number; fiber_g: number
}
const FOOD_COLS = 'id, name, serving_grams, calories, protein_g, carbs_g, fat_g, fiber_g'

// Exact, case-insensitive name match — trusted and stable (no per-run drift).
async function findExactFood(query: string): Promise<FoodRow | null> {
  const { data } = await serviceClient
    .from('food_library').select(FOOD_COLS).ilike('name', query.trim()).limit(2)
  return data && data.length === 1 ? (data[0] as FoodRow) : null
}

// Trigram fuzzy match.
async function findFuzzyFood(query: string): Promise<{ food: FoodRow; similarity: number } | null> {
  const { data: fuzzy, error } = await serviceClient.rpc('match_food_fuzzy', {
    p_query: normalizeName(query), p_limit: 1,
  })
  if (error) console.error('fuzzy_rpc_error', error.message)
  const top = Array.isArray(fuzzy) ? fuzzy[0] : null
  if (top && top.similarity >= FUZZY_MIN_SIMILARITY) {
    const { data: fl } = await serviceClient.from('food_library').select(FOOD_COLS).eq('id', top.food_id).maybeSingle()
    if (fl) return { food: fl as FoodRow, similarity: Number(top.similarity) }
  }
  return null
}

// Best available match for an ingredient name (exact, then fuzzy).
async function findLibraryFood(query: string): Promise<FoodRow | null> {
  return (await findExactFood(query)) ?? (await findFuzzyFood(query))?.food ?? null
}

// Build a resolved item from a matched library food (shared by exact + fuzzy).
async function buildMatched(
  item: AiItem, food: FoodRow, source: 'library' | 'fuzzy', warnings: string[],
): Promise<ResolvedItem> {
  const { grams, usedDefaultServing } = await gramsForMatchedFood(
    food.id, Number(food.serving_grams), item.unit, item.quantity, item.estimated_grams,
  )
  if (usedDefaultServing) warnings.push(`no_portion_data:${item.name}:${item.unit}`)
  const macros = scaleMacros(
    { calories: Number(food.calories), protein_g: Number(food.protein_g), carbs_g: Number(food.carbs_g), fat_g: Number(food.fat_g), fiber_g: Number(food.fiber_g) },
    Number(food.serving_grams), grams,
  )
  return {
    name: item.name, quantity: item.quantity, unit: item.unit,
    matched_food_id: food.id, matched_name: food.name, grams,
    source, ...macros,
  }
}

function perGram(food: FoodRow): Macros {
  const sg = Number(food.serving_grams) || 100
  return {
    calories: Number(food.calories) / sg, protein_g: Number(food.protein_g) / sg,
    carbs_g: Number(food.carbs_g) / sg, fat_g: Number(food.fat_g) / sg, fiber_g: Number(food.fiber_g) / sg,
  }
}

// A composed dish is trustworthy only when most of its mass resolves to real
// library ingredients — otherwise the sum silently undercounts.
const DECOMP_MIN_MATCH_RATIO = 0.8

// Compute a cooked/composite dish's macros by summing its raw ingredients from
// the (authoritative) library. Returns null when there aren't enough ingredients
// or too little of the mass matched — the caller then falls back to matching or
// the AI estimate.
async function decompose(item: AiItem, warnings: string[]): Promise<ResolvedItem | null> {
  const ings = item.ingredients
  if (!ings || ings.length < 2) return null

  const round1 = (n: number) => Math.round(n * 10) / 10
  let totalGrams = 0
  let matchedGrams = 0
  const sum: Macros = { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 }
  const parts: ResolvedIngredient[] = []
  for (const ing of ings) {
    totalGrams += ing.grams
    const found = await findLibraryFood(ing.name)
    if (!found) continue
    const pg = perGram(found)
    const m = {
      calories: pg.calories * ing.grams, protein_g: pg.protein_g * ing.grams,
      carbs_g: pg.carbs_g * ing.grams, fat_g: pg.fat_g * ing.grams, fiber_g: pg.fiber_g * ing.grams,
    }
    sum.calories += m.calories; sum.protein_g += m.protein_g
    sum.carbs_g += m.carbs_g; sum.fat_g += m.fat_g; sum.fiber_g += m.fiber_g
    matchedGrams += ing.grams
    parts.push({
      name: found.name, grams: Math.round(ing.grams),
      calories: round1(m.calories), protein_g: round1(m.protein_g),
      carbs_g: round1(m.carbs_g), fat_g: round1(m.fat_g), fiber_g: round1(m.fiber_g),
    })
  }
  if (totalGrams <= 0 || matchedGrams / totalGrams < DECOMP_MIN_MATCH_RATIO) return null

  // Display grams = the eaten/cooked weight the model estimated, NOT the sum of
  // dry ingredient weights (staples are counted dry, so that sum understates the
  // real portion — e.g. 37 g for two parathas). Macros still come from the
  // authoritative dry-ingredient sum above.
  const displayGrams = item.estimated_grams > 0 ? Math.round(item.estimated_grams) : Math.round(totalGrams)
  warnings.push(`composed:${item.name}(${Math.round((matchedGrams / totalGrams) * 100)}%)`)
  return {
    name: item.name, quantity: item.quantity, unit: item.unit,
    matched_food_id: null, matched_name: item.name, grams: displayGrams,
    source: 'composed',
    calories: round1(sum.calories), protein_g: round1(sum.protein_g),
    carbs_g: round1(sum.carbs_g), fat_g: round1(sum.fat_g), fiber_g: round1(sum.fiber_g),
    ingredients: parts,
  }
}

async function resolveItem(item: AiItem, warnings: string[]): Promise<ResolvedItem> {
  const normalized = normalizeName(item.name)

  // 1. Exact library match wins first — calibrated seed/IFCT values are stable
  //    run-to-run (no AI portion drift). e.g. "dal fry", "chai", "roti".
  const exact = await findExactFood(item.name)
  if (exact) return buildMatched(item, exact, 'library', warnings)

  // 2. Otherwise, if it's a composite dish with ingredients, sum them from the
  //    DB — accurate for home food the library doesn't have as one row.
  const composed = await decompose(item, warnings)
  if (composed) return composed

  // 3. Fuzzy whole-item match.
  const fuzzy = await findFuzzyFood(item.name)
  if (fuzzy) {
    if (fuzzy.similarity < 0.6) warnings.push(`low_confidence_match:${item.name}->${fuzzy.food.name}`)
    return buildMatched(item, fuzzy.food, 'fuzzy', warnings)
  }

  // 4. Previously cached AI estimate (dedup by normalized_name).
  const { data: cached } = await serviceClient
    .from('ai_food_estimates')
    .select('id, name, serving_grams, calories, protein_g, carbs_g, fat_g, fiber_g')
    .eq('normalized_name', normalized)
    .maybeSingle()
  if (cached) {
    const grams = item.estimated_grams
    const macros = scaleMacros(
      { calories: Number(cached.calories), protein_g: Number(cached.protein_g), carbs_g: Number(cached.carbs_g), fat_g: Number(cached.fat_g), fiber_g: Number(cached.fiber_g) },
      Number(cached.serving_grams), grams,
    )
    warnings.push(`ai_estimated:${item.name}`)
    return {
      name: item.name, quantity: item.quantity, unit: item.unit,
      matched_food_id: null, matched_name: cached.name, grams,
      source: 'ai_estimated', ...macros,
    }
  }

  // 3. Fresh AI estimate (already sanitized in parseAiItems) → cache it.
  const grams = item.estimated_grams
  const macros = scaleMacros(item.estimate_per_100g, 100, grams)
  warnings.push(`ai_estimated:${item.name}`)

  const { error: insertErr } = await serviceClient
    .from('ai_food_estimates')
    .upsert(
      {
        normalized_name: normalized,
        name: item.name,
        calories: item.estimate_per_100g.calories,
        protein_g: item.estimate_per_100g.protein_g,
        carbs_g: item.estimate_per_100g.carbs_g,
        fat_g: item.estimate_per_100g.fat_g,
        fiber_g: item.estimate_per_100g.fiber_g,
        serving_size: '100 g',
        serving_grams: 100,
        source: 'ai_estimated',
      },
      { onConflict: 'normalized_name', ignoreDuplicates: true },
    )
  if (insertErr) console.error('ai_food_estimates_insert_error', insertErr.message)

  return {
    name: item.name, quantity: item.quantity, unit: item.unit,
    matched_food_id: null, matched_name: null, grams,
    source: 'ai_estimated', ...macros,
  }
}

// -- wire shape (the contract the frontend consumes) --------------------------
// Kept deliberately separate from the internal ResolvedItem so field names are
// stable for the client: food_id (not matched_food_id), source normalised to
// 'ifct'|'ai_estimated', and an explicit `matched` flag.
type WireItem = {
  name: string
  quantity: number
  unit: string
  food_id: string | null
  custom_food_id: string | null
  matched_name: string | null
  grams: number
  source: 'ifct' | 'ai_estimated'
  matched: boolean
  ingredients?: ResolvedIngredient[]
} & Macros

function toWireItem(it: ResolvedItem): WireItem {
  // library/fuzzy resolve to a single food row (has food_id); composed dishes
  // and raw AI estimates don't, so they ride the ai_estimated lane on the wire.
  const source: 'ifct' | 'ai_estimated' =
    it.source === 'library' || it.source === 'fuzzy' ? 'ifct' : 'ai_estimated'
  return {
    name: it.name,
    quantity: it.quantity,
    unit: it.unit,
    food_id: it.matched_food_id,
    custom_food_id: null,
    // Canonical library name so the client can show what it actually resolved to.
    matched_name: it.matched_name,
    grams: it.grams,
    source,
    matched: it.matched_food_id !== null,
    calories: it.calories,
    protein_g: it.protein_g,
    carbs_g: it.carbs_g,
    fat_g: it.fat_g,
    fiber_g: it.fiber_g,
    ingredients: it.ingredients,
  }
}

function sumTotals(items: ResolvedItem[]): Macros {
  const round1 = (n: number) => Math.round(n * 10) / 10
  return items.reduce(
    (acc, it) => ({
      calories: round1(acc.calories + it.calories),
      protein_g: round1(acc.protein_g + it.protein_g),
      carbs_g: round1(acc.carbs_g + it.carbs_g),
      fat_g: round1(acc.fat_g + it.fat_g),
      fiber_g: round1(acc.fiber_g + it.fiber_g),
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 },
  )
}

// -- handler -------------------------------------------------------------------
Deno.serve(async (req) => {
  const cors = corsHeaders(req.headers.get('origin'))
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors })
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' }, cors)

  const user = await authenticate(req)
  if (!user) return json(401, { error: 'unauthorized' }, cors)

  let body: { text?: unknown; userId?: unknown }
  try {
    body = await req.json()
  } catch {
    return json(400, { error: 'invalid_json_body' }, cors)
  }

  const text = typeof body.text === 'string' ? body.text.trim() : ''
  const userId = typeof body.userId === 'string' ? body.userId : ''
  if (!text) return json(400, { error: 'text_required' }, cors)
  if (userId && userId !== user.id) return json(401, { error: 'user_mismatch' }, cors)

  const rl = await checkRateLimit(user.id)
  if (!rl.allowed) return json(429, { error: 'rate_limited' }, cors)

  // Never log the raw text -- only a length, for debugging without leaking content.
  console.log('parse_meal_request', { userId: user.id, textLength: text.length })

  const { items: aiItems, providerFailed } = await extractItems(text)

  if (aiItems === null) {
    // Every provider failed (or none configured) -- never a 500; let the client
    // fall back to manual entry.
    console.error('parse_meal_all_providers_failed', providerFailed)
    return json(200, {
      items: [],
      totals: { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 },
      warnings: ['ai_unavailable'],
      // snake_case is the contract; camelCase kept for older clients.
      manual_entry: true,
      manualEntry: true,
    }, cors)
  }

  if (aiItems.length === 0) {
    return json(200, {
      items: [],
      totals: { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 },
      warnings: ['no_items_recognized'],
      manual_entry: false,
      manualEntry: false,
    }, cors)
  }

  const warnings: string[] = []
  const resolved: ResolvedItem[] = []
  for (const item of aiItems) {
    try {
      resolved.push(await resolveItem(item, warnings))
    } catch (e) {
      console.error('resolve_item_error', e instanceof Error ? e.message : 'unknown')
      warnings.push(`resolve_failed:${item.name}`)
    }
  }

  return json(200, {
    items: resolved.map(toWireItem),
    totals: sumTotals(resolved),
    warnings,
    manual_entry: false,
    manualEntry: false,
  }, cors)
})
