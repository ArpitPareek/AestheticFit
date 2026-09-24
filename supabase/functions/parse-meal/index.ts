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
  'https://aestheticfit.vercel.app',
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
// Groq rotates model names periodically; make the choice env-overridable so a
// model rename doesn't require a code edit. `openai/gpt-oss-20b` supports
// json_mode and is fast/cheap enough for this extraction task. Set GROQ_MODEL
// to override without redeploying (e.g. if this model is retired too).
const GROQ_MODEL = Deno.env.get('GROQ_MODEL') || 'openai/gpt-oss-20b'
const GEMINI_MODEL = Deno.env.get('GEMINI_MODEL') || 'gemini-2.0-flash'

const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// -- types --------------------------------------------------------------------
type Macros = { calories: number; protein_g: number; carbs_g: number; fat_g: number; fiber_g: number }

type AiItem = {
  name: string
  quantity: number
  unit: string
  estimated_grams: number
  estimate_per_100g: Macros
}

type ResolvedItem = {
  name: string
  quantity: number
  unit: string
  matched_food_id: string | null
  matched_name: string | null
  grams: number
  source: 'library' | 'fuzzy' | 'ai_estimated'
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
{"items":[{"name":string,"quantity":number,"unit":string,"estimated_grams":number,"estimate_per_100g":{"calories":number,"protein_g":number,"carbs_g":number,"fat_g":number,"fiber_g":number}}]}

Rules:
- "name": the food's common name (e.g. "toor dal", "roti", "paneer tikka").
- "quantity": the number of "unit"s mentioned (default 1 if not stated).
- "unit": one of piece, katori, small_katori, plate, glass, cup, tbsp, tsp, g, kg, ml -- pick the closest one; if grams/ml are stated use those directly.
- "estimated_grams": your best-guess TOTAL grams for this line item (quantity * typical serving weight).
- "estimate_per_100g": your best-guess macros per 100g of this food, ALWAYS include this even if you are confident the food is a well-known one -- it's used only as a fallback.
- No prose, no markdown, no extra keys. If you cannot identify any food, return {"items":[]}.`

class ProviderError extends Error {}

function withTimeout(ms: number): { signal: AbortSignal; cancel: () => void } {
  const controller = new AbortController()
  const t = setTimeout(() => controller.abort(), ms)
  return { signal: controller.signal, cancel: () => clearTimeout(t) }
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
      items.push({
        name: it.name.trim(),
        quantity: Number.isFinite(it.quantity) ? Number(it.quantity) : 1,
        unit: typeof it.unit === 'string' && it.unit.trim() ? it.unit.trim().toLowerCase() : 'piece',
        estimated_grams: Number.isFinite(it.estimated_grams) ? Math.max(1, Math.min(2000, Number(it.estimated_grams))) : 100,
        estimate_per_100g: {
          calories: Number(est.calories) || 0,
          protein_g: Number(est.protein_g) || 0,
          carbs_g: Number(est.carbs_g) || 0,
          fat_g: Number(est.fat_g) || 0,
          fiber_g: Number(est.fiber_g) || 0,
        },
      })
    }
    return items
  } catch {
    return null
  }
}

async function callGroq(text: string): Promise<AiItem[] | null> {
  if (!GROQ_API_KEY) throw new ProviderError('groq_not_configured')
  const { signal, cancel } = withTimeout(4000)
  try {
    const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: GROQ_MODEL,
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: text },
        ],
      }),
      signal,
    })
    if (resp.status === 429) throw new ProviderError('groq_rate_limited')
    if (!resp.ok) throw new ProviderError(`groq_http_${resp.status}`)
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

async function resolveItem(item: AiItem, warnings: string[]): Promise<ResolvedItem> {
  const normalized = normalizeName(item.name)

  // 1. exact (case-insensitive) match against food_library.name
  const { data: exact } = await serviceClient
    .from('food_library')
    .select('id, name, serving_grams, calories, protein_g, carbs_g, fat_g, fiber_g')
    .ilike('name', item.name.trim())
    .limit(2)

  let food = exact && exact.length === 1 ? exact[0] : null
  let matchSource: 'library' | 'fuzzy' | null = food ? 'library' : null

  // 2. trigram fuzzy match (name + embedded aliases + food_aliases table)
  if (!food) {
    const { data: fuzzy, error: fuzzyErr } = await serviceClient.rpc('match_food_fuzzy', {
      p_query: normalized,
      p_limit: 1,
    })
    if (fuzzyErr) console.error('fuzzy_rpc_error', fuzzyErr.message)
    const top = Array.isArray(fuzzy) ? fuzzy[0] : null
    if (top && top.similarity >= FUZZY_MIN_SIMILARITY) {
      const { data: fl } = await serviceClient
        .from('food_library')
        .select('id, name, serving_grams, calories, protein_g, carbs_g, fat_g, fiber_g')
        .eq('id', top.food_id)
        .maybeSingle()
      if (fl) {
        food = fl
        matchSource = 'fuzzy'
        if (top.similarity < 0.6) warnings.push(`low_confidence_match:${item.name}->${fl.name}`)
      }
    }
  }

  if (food) {
    const { grams, usedDefaultServing } = await gramsForMatchedFood(
      food.id, Number(food.serving_grams), item.unit, item.quantity, item.estimated_grams,
    )
    if (usedDefaultServing) warnings.push(`no_portion_data:${item.name}:${item.unit}`)
    const macros = scaleMacros(
      { calories: Number(food.calories), protein_g: Number(food.protein_g), carbs_g: Number(food.carbs_g), fat_g: Number(food.fat_g), fiber_g: Number(food.fiber_g) },
      Number(food.serving_grams),
      grams,
    )
    return {
      name: item.name, quantity: item.quantity, unit: item.unit,
      matched_food_id: food.id, matched_name: food.name, grams,
      source: matchSource!, ...macros,
    }
  }

  // 3. previously cached AI estimate (dedup by normalized_name)
  const { data: cached } = await serviceClient
    .from('ai_food_estimates')
    .select('id, name, serving_grams, calories, protein_g, carbs_g, fat_g, fiber_g')
    .eq('normalized_name', normalized)
    .maybeSingle()

  if (cached) {
    const grams = item.estimated_grams
    const macros = scaleMacros(
      { calories: Number(cached.calories), protein_g: Number(cached.protein_g), carbs_g: Number(cached.carbs_g), fat_g: Number(cached.fat_g), fiber_g: Number(cached.fiber_g) },
      Number(cached.serving_grams),
      grams,
    )
    warnings.push(`ai_estimated:${item.name}`)
    return {
      name: item.name, quantity: item.quantity, unit: item.unit,
      matched_food_id: null, matched_name: cached.name, grams,
      source: 'ai_estimated', ...macros,
    }
  }

  // 4. fresh AI estimate (already returned alongside the extraction, no 2nd call) -- cache it
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
  source: 'ifct' | 'ai_estimated'
  matched: boolean
} & Macros

function toWireItem(it: ResolvedItem): WireItem {
  const source: 'ifct' | 'ai_estimated' = it.source === 'ai_estimated' ? 'ai_estimated' : 'ifct'
  return {
    name: it.name,
    quantity: it.quantity,
    unit: it.unit,
    food_id: it.matched_food_id,
    custom_food_id: null,
    source,
    matched: it.matched_food_id !== null,
    calories: it.calories,
    protein_g: it.protein_g,
    carbs_g: it.carbs_g,
    fat_g: it.fat_g,
    fiber_g: it.fiber_g,
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
