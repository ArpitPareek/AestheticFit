/**
 * seed-food.ts
 *
 * Loads the IFCT 2017 food composition table (npm package `ifct2017`) into
 * food_library with STABLE ids (the official IFCT food code, e.g. 'A001').
 *
 * Two outputs:
 *   1. ALWAYS emits supabase/seed-food-ifct.sql — plain INSERT … ON CONFLICT
 *      statements you can paste into the Supabase SQL editor (no CLI needed).
 *   2. OPTIONALLY pushes straight to the DB when run with `--push` and
 *      SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are set (upsert on id).
 *
 * IFCT source columns used (per 100 g):
 *   enerc    energy in kJ   → calories = round(enerc / 4.184)
 *   protcnt  protein  (g)
 *   choavldf available carbohydrate by difference (g)  → carbs
 *   fatce    total fat (g)
 *   fibtg    total dietary fibre (g)
 *   grup     food group  → category
 *   tags     dietary tags → is_vegetarian
 *   scie/lang scientific + vernacular names → aliases[]
 *
 * ID SCHEME: id = the IFCT code (UPPERCASE). This never collides with the
 * lowercase-kebab composite-dish slugs already in food_library. See migration
 * 041 for the full three-range scheme.
 *
 * Run:
 *   node --experimental-strip-types scripts/seed-food.ts        # emit sql only
 *   npx tsx scripts/seed-food.ts                                # emit sql only
 *   npx tsx --env-file=.env.seed scripts/seed-food.ts --push    # emit + upsert
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(__dirname, '..')
const OUT_SQL = join(repoRoot, 'supabase', 'seed-food-ifct.sql')
const KJ_PER_KCAL = 4.184

// Resolve the CSV shipped inside the ifct2017 package (its runtime API needs
// Deno import maps; the raw data file does not, so we read the file directly).
// The package's "exports" map blocks resolving its package.json, so prefer the
// conventional node_modules path and fall back to resolving a subpath export.
const require = createRequire(import.meta.url)
function resolveCsv(): string {
  const direct = join(repoRoot, 'node_modules', 'ifct2017', 'compositions', 'index.csv')
  if (existsSync(direct)) return direct
  const sub = require.resolve('ifct2017/compositions/index.js')
  return join(dirname(sub), 'index.csv')
}
const CSV_PATH = resolveCsv()

// ── minimal RFC-4180 CSV parser (fields may be quoted and contain commas) ─────
function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let field = ''
  let row: string[] = []
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++ }
        else inQuotes = false
      } else field += c
    } else if (c === '"') inQuotes = true
    else if (c === ',') { row.push(field); field = '' }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      if (field !== '' || row.length) { row.push(field); rows.push(row); row = []; field = '' }
    } else field += c
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row) }
  return rows
}

const num = (s: string | undefined): number => {
  const n = Number((s ?? '').trim())
  return Number.isFinite(n) ? n : 0
}

// Vernacular names from the `lang` field: "H. Ramdana; Tam. Keerai vidai" →
// ['Ramdana', 'Keerai vidai']. Plus the scientific name. Deduped, capped.
function buildAliases(scie: string, lang: string): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  const push = (raw: string) => {
    const v = raw.replace(/^[A-Za-z]{1,6}\.\s*/, '').replace(/\.$/, '').trim()
    const key = v.toLowerCase()
    if (v.length >= 2 && v.length <= 60 && !seen.has(key)) { seen.add(key); out.push(v) }
  }
  if (scie) push(scie)
  for (const part of (lang || '').split(';')) push(part)
  return out.slice(0, 8)
}

type FoodRow = {
  id: string
  name: string
  aliases: string[]
  category: string
  is_vegetarian: boolean
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g: number
}

function loadRows(): FoodRow[] {
  const csv = parseCsv(readFileSync(CSV_PATH, 'utf8'))
  const header = csv[0]
  const idx = Object.fromEntries(header.map((h, i) => [h, i]))
  const rows: FoodRow[] = []
  for (const r of csv.slice(1)) {
    const id = (r[idx.code] ?? '').trim()
    const name = (r[idx.name] ?? '').trim()
    if (!id || !name) continue
    const tags = r[idx.tags] ?? ''
    const protein_g = Number(num(r[idx.protcnt]).toFixed(2))
    const carbs_g = Number(num(r[idx.choavldf]).toFixed(2))
    const fat_g = Number(num(r[idx.fatce]).toFixed(2))
    const fiber_g = Number(num(r[idx.fibtg]).toFixed(2))
    // IFCT records energy in kJ. A handful of rows (all pure edible oils/fats)
    // have enerc = 0 — fall back to an Atwater estimate from the macros so oils
    // aren't logged as 0 kcal.
    const kcalFromEnergy = Math.round(num(r[idx.enerc]) / KJ_PER_KCAL)
    const calories = kcalFromEnergy > 0
      ? kcalFromEnergy
      : Math.round(protein_g * 4 + carbs_g * 4 + fat_g * 9)
    rows.push({
      id,
      name,
      aliases: buildAliases(r[idx.scie] ?? '', r[idx.lang] ?? ''),
      category: (r[idx.grup] ?? 'Miscellaneous Foods').trim(),
      is_vegetarian: /(?:^|\s)vegetarian(?:\s|$)/.test(tags),
      calories,
      protein_g,
      carbs_g,
      fat_g,
      fiber_g,
    })
  }
  return rows
}

// ── SQL emit ─────────────────────────────────────────────────────────────────
const q = (s: string) => `'${s.replace(/'/g, "''")}'`
const arr = (a: string[]) =>
  a.length ? `ARRAY[${a.map(q).join(',')}]::text[]` : `'{}'::text[]`

function emitSql(rows: FoodRow[]): void {
  const values = rows
    .map(
      (r) =>
        `(${q(r.id)}, ${q(r.name)}, ${arr(r.aliases)}, ${q(r.category)}, ${r.is_vegetarian}, ` +
        `'100 g', 100, ${r.calories}, ${r.protein_g}, ${r.carbs_g}, ${r.fat_g}, ${r.fiber_g}, 'ifct')`,
    )
    .join(',\n')

  const sql = `-- seed-food-ifct.sql  (GENERATED by scripts/seed-food.ts — do not hand-edit)
-- IFCT 2017 composition table → food_library, ${rows.length} rows.
-- id = official IFCT code (UPPERCASE); never collides with kebab-slug composites.
-- Macros per 100 g. Energy converted kJ→kcal (÷ ${KJ_PER_KCAL}).
-- Idempotent: ON CONFLICT (id) refreshes the row. RUN WHOLE in the SQL editor.

insert into food_library
  (id, name, aliases, category, is_vegetarian, serving_size, serving_grams,
   calories, protein_g, carbs_g, fat_g, fiber_g, source)
values
${values}
on conflict (id) do update set
  name          = excluded.name,
  aliases       = excluded.aliases,
  category      = excluded.category,
  is_vegetarian = excluded.is_vegetarian,
  serving_size  = excluded.serving_size,
  serving_grams = excluded.serving_grams,
  calories      = excluded.calories,
  protein_g     = excluded.protein_g,
  carbs_g       = excluded.carbs_g,
  fat_g         = excluded.fat_g,
  fiber_g       = excluded.fiber_g,
  source        = excluded.source;
`
  writeFileSync(OUT_SQL, sql)
  console.log(`Wrote ${rows.length} IFCT rows → ${OUT_SQL}`)
}

// ── optional direct push ─────────────────────────────────────────────────────
async function push(rows: FoodRow[]): Promise<void> {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('--push requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (see .env.seed).')
    process.exit(1)
  }
  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(url, key, { auth: { persistSession: false } })
  const payload = rows.map((r) => ({
    id: r.id,
    name: r.name,
    aliases: r.aliases,
    category: r.category,
    is_vegetarian: r.is_vegetarian,
    serving_size: '100 g',
    serving_grams: 100,
    calories: r.calories,
    protein_g: r.protein_g,
    carbs_g: r.carbs_g,
    fat_g: r.fat_g,
    fiber_g: r.fiber_g,
    source: 'ifct',
  }))
  for (let i = 0; i < payload.length; i += 200) {
    const chunk = payload.slice(i, i + 200)
    const { error } = await supabase.from('food_library').upsert(chunk, { onConflict: 'id' })
    if (error) throw error
    console.log(`  upserted ${Math.min(i + 200, payload.length)}/${payload.length}`)
  }
  console.log('Push complete.')
}

async function main(): Promise<void> {
  const rows = loadRows()
  console.log(`Parsed ${rows.length} IFCT rows from ${CSV_PATH}`)
  emitSql(rows)
  if (process.argv.includes('--push')) await push(rows)
}

main().catch((e) => {
  console.error('seed-food failed:', e instanceof Error ? e.message : e)
  process.exit(1)
})
