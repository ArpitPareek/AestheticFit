// Verification harness for the coach-authored plans (migrations 022 + 023).
//  1. Round-trips every plan_data jsonb literal embedded in 023 back to an
//     object and deep-compares it to the source person_[ab]_phases.json — proves
//     the SQL embedding is byte-identical (no escaping corruption).
//  2. Confirms every ref + alternative id resolves in (library-53 ∪ new-5).
//  3. Prints per-muscle weekly SET counts for every phase (Phase 2 highlighted),
//     using each chosen exercise's primary_muscle.
import { readFileSync } from 'node:fs'

const ROOT = '/Users/arpitpareek/Desktop/personal/AestheticFit'
const A = JSON.parse(readFileSync(`${ROOT}/person_a_phases.json`, 'utf8'))
const B = JSON.parse(readFileSync(`${ROOT}/person_b_phases.json`, 'utf8'))
const lib = JSON.parse(readFileSync(`${ROOT}/_verify_lib.json`, 'utf8'))
const sql = readFileSync(`${ROOT}/supabase/migrations/023_coach_plans_seed.sql`, 'utf8')

// primary_muscle map: 53 canonical rows + the 5 new ones (mirrors migration 022).
const pm = new Map(lib.map((r) => [r.id, r.primary_muscle]))
const NEW = {
  'landmine-press': 'front_delt',
  'incline-push-up': 'chest',
  'assisted-pull-up': 'lats',
  'hip-abduction-machine': 'glutes',
  'cable-glute-kickback': 'glutes',
}
for (const [id, m] of Object.entries(NEW)) pm.set(id, m)
const known = new Set(pm.keys())

let fail = 0

// ── 1. Round-trip the embedded jsonb literals ──────────────────────────────
const embedded = []
for (const line of sql.split('\n')) {
  const m = line.match(/^\s*\$plandata\$(\{"version".*\})\$plandata\$::jsonb,?\s*$/)
  if (m) embedded.push(JSON.parse(m[1]))
}
const source = [...A, ...B] // A P1-4 then B P1-4, matches 023 emit order
if (embedded.length !== 8) { console.log(`❌ expected 8 embedded plan_data, found ${embedded.length}`); fail++ }
embedded.forEach((obj, i) => {
  const same = JSON.stringify(obj) === JSON.stringify(source[i])
  if (!same) { console.log(`❌ embedded plan_data #${i} != source`); fail++ }
})
console.log(`1. jsonb round-trip: ${embedded.length}/8 literals, deep-equal to source: ${fail === 0 ? 'PASS' : 'FAIL'}`)

// ── 2. Every ref + alternative resolves ────────────────────────────────────
const unresolved = new Set()
for (const phases of [A, B])
  for (const p of phases)
    for (const d of p.days)
      for (const e of d.exercises) {
        if (!known.has(e.ref.id)) unresolved.add(e.ref.id)
        for (const alt of e.alternatives ?? []) if (!known.has(alt.id)) unresolved.add(alt.id)
      }
if (unresolved.size) { console.log(`2. unresolved ids: ❌ ${[...unresolved].join(', ')}`); fail++ }
else console.log('2. ref + alternative resolution: PASS (all resolve in library∪new)')

// ── 3. Per-muscle weekly SET counts ────────────────────────────────────────
function muscleSets(phase) {
  const m = {}
  for (const d of phase.days)
    for (const e of d.exercises) {
      const mu = pm.get(e.ref.id) ?? `??${e.ref.id}`
      m[mu] = (m[mu] ?? 0) + e.sets
    }
  return m
}
const ORDER = ['chest', 'upper_chest', 'front_delt', 'side_delt', 'rear_delt', 'lats', 'back',
  'traps', 'biceps', 'triceps', 'quads', 'hamstrings', 'glutes', 'calves', 'core']
function printMuscle(label, m) {
  console.log(`\n   ${label}`)
  let total = 0
  for (const k of ORDER) if (m[k]) { console.log(`     ${k.padEnd(12)} ${m[k]}`); total += m[k] }
  for (const k of Object.keys(m)) if (!ORDER.includes(k)) { console.log(`     ${k.padEnd(12)} ${m[k]} (unordered!)`); total += m[k] }
  console.log(`     ${'TOTAL'.padEnd(12)} ${total}`)
  return m
}

console.log('\n3. Weekly SETS per primary_muscle')
for (const [who, phases] of [['Person A (recomp)', A], ['Person B (cut)', B]]) {
  console.log(`\n══ ${who} ══`)
  phases.forEach((p) => printMuscle(`Phase ${p.phase}${p.phase === 2 ? '  ◀ highlighted' : ''}`, muscleSets(p)))
}

// ── 4. Step-6 assertions on Phase 2 ────────────────────────────────────────
console.log('\n4. Phase-2 intent checks')
const a2 = muscleSets(A[1]), b2 = muscleSets(B[1])
const aDelt = a2.side_delt ?? 0
const aChestUpper = a2.upper_chest ?? 0, aChestFlat = a2.chest ?? 0
const aSideVsOtherDelts = aDelt >= (a2.front_delt ?? 0) && aDelt >= (a2.rear_delt ?? 0)
console.log(`   A: side_delt=${aDelt} (front=${a2.front_delt ?? 0}, rear=${a2.rear_delt ?? 0}) side-delt-highest-delt=${aSideVsOtherDelts ? 'PASS' : 'FAIL'}`)
console.log(`   A: upper_chest=${aChestUpper} vs flat chest=${aChestFlat} incline-biased=${aChestUpper >= aChestFlat ? 'PASS' : 'FAIL'}`)
const bGlutes = b2.glutes ?? 0
const bMax = Math.max(...Object.values(b2))
console.log(`   B: glutes=${bGlutes}, max-of-any-muscle=${bMax} glutes-highest=${bGlutes === bMax ? 'PASS' : 'FAIL'}`)

console.log(`\n${fail === 0 ? '✅ ALL STRUCTURAL CHECKS PASS' : `❌ ${fail} check(s) failed`}`)
