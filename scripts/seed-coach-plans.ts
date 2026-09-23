/**
 * seed-coach-plans.ts
 *
 * Parameterized replacement for the hardcoded UUID seeding in migrations
 * 023 (coach_plans_seed). The two Auth user IDs are read from the environment
 * (.env.seed, gitignored) — NO UUID literals live in this file or in git.
 *
 * The plan bodies are the same non-secret JSON already committed at the repo
 * root (person_a_phases.json / person_b_phases.json); only the user identity is
 * secret, so only the user identity is parameterized.
 *
 * Idempotent + non-destructive: a phase is inserted only if that user has no
 * coach_authored row for it yet — matching the `where not exists` guard in 023.
 * Re-running never duplicates and never touches auto_generated plans. Nothing
 * is activated here (is_active stays false); go-live is a separate step.
 *
 * Run (Node 20+):
 *   cp .env.seed.example .env.seed   # fill in real values
 *   node --env-file=.env.seed scripts/seed-coach-plans.ts
 *   # or: npx tsx --env-file=.env.seed scripts/seed-coach-plans.ts
 *
 * Requires migrations 021 (plan columns) and 022 (referenced library rows).
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { createClient } from '@supabase/supabase-js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(__dirname, '..')

// ── env ──────────────────────────────────────────────────────────────────────
function required(name: string): string {
  const v = process.env[name]
  if (!v || !v.trim()) {
    console.error(`Missing required env var ${name}. See .env.seed.example.`)
    process.exit(1)
  }
  return v.trim()
}

const SUPABASE_URL = required('SUPABASE_URL')
const SERVICE_ROLE_KEY = required('SUPABASE_SERVICE_ROLE_KEY')
const USER_A = required('SEED_USER_A')
const USER_B = required('SEED_USER_B')

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
for (const [k, v] of [['SEED_USER_A', USER_A], ['SEED_USER_B', USER_B]] as const) {
  if (!UUID_RE.test(v)) {
    console.error(`${k} is not a valid UUID: ${v}`)
    process.exit(1)
  }
}

// ── per-phase metadata (mirrors migration 023; identity lives in columns) ──────
type PhaseMeta = {
  weeks_per_phase: number
  phase_weeks: number
  sort_order: number
  start_date: string | null
}

type CoachProfile = {
  userId: string
  planName: string
  phasesFile: string
  meta: PhaseMeta[] // index 0 == phase 1
}

const START_DATE = '2026-09-24'

const PROFILES: CoachProfile[] = [
  {
    userId: USER_A,
    planName: 'Coach: A — Recomp V-Taper',
    phasesFile: 'person_a_phases.json',
    meta: [
      { weeks_per_phase: 5, phase_weeks: 5, sort_order: 1, start_date: START_DATE },
      { weeks_per_phase: 6, phase_weeks: 6, sort_order: 2, start_date: null },
      { weeks_per_phase: 6, phase_weeks: 6, sort_order: 3, start_date: null },
      { weeks_per_phase: 4, phase_weeks: 4, sort_order: 4, start_date: null },
    ],
  },
  {
    userId: USER_B,
    planName: 'Coach: B — Wedding Cut',
    phasesFile: 'person_b_phases.json',
    meta: [
      { weeks_per_phase: 4, phase_weeks: 4, sort_order: 1, start_date: START_DATE },
      { weeks_per_phase: 6, phase_weeks: 6, sort_order: 2, start_date: null },
      { weeks_per_phase: 5, phase_weeks: 5, sort_order: 3, start_date: null },
      { weeks_per_phase: 4, phase_weeks: 4, sort_order: 4, start_date: null },
    ],
  },
]

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

async function seedProfile(p: CoachProfile): Promise<void> {
  const phases = JSON.parse(readFileSync(join(repoRoot, p.phasesFile), 'utf8')) as unknown[]
  if (!Array.isArray(phases) || phases.length !== p.meta.length) {
    throw new Error(`${p.phasesFile}: expected ${p.meta.length} phases, got ${(phases as unknown[])?.length}`)
  }

  // Existing coach_authored phases for this user → skip set (idempotency).
  const { data: existing, error: exErr } = await supabase
    .from('workout_plans')
    .select('phase')
    .eq('user_id', p.userId)
    .eq('plan_source', 'coach_authored')
  if (exErr) throw exErr
  const have = new Set((existing ?? []).map((r) => r.phase as number))

  const rows = phases
    .map((planData, i) => {
      const phaseNumber = i + 1
      const m = p.meta[i]
      return {
        user_id: p.userId,
        assessment_id: null,
        plan_version: 1,
        plan_name: p.planName,
        plan_data: planData,
        phase: phaseNumber,
        total_phases: p.meta.length,
        weeks_per_phase: m.weeks_per_phase,
        phase_weeks: m.phase_weeks,
        sort_order: m.sort_order,
        start_date: m.start_date,
        is_active: false,
        plan_source: 'coach_authored',
      }
    })
    .filter((r) => !have.has(r.phase))

  if (rows.length === 0) {
    console.log(`  ${p.planName}: already seeded (all ${p.meta.length} phases present) — skipped`)
    return
  }

  const { error } = await supabase.from('workout_plans').insert(rows)
  if (error) throw error
  console.log(`  ${p.planName}: inserted phases ${rows.map((r) => r.phase).join(', ')}`)
}

async function main(): Promise<void> {
  console.log('Seeding coach plans (inactive)…')
  for (const p of PROFILES) {
    await seedProfile(p)
  }
  console.log('Done. Coach plans are inactive; activate separately (go-live).')
}

main().catch((e) => {
  console.error('Seed failed:', e instanceof Error ? e.message : e)
  process.exit(1)
})
