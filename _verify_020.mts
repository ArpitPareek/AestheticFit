// Verification harness for migration 020. Runs the REAL generator core
// (generatePhasePlanData) + selector + templates against the post-migration
// library (_verify_lib.json = the exact 53 rows migration 020 upserts).
// NOT the tsx exercises.ts fixture — this is the migration's own row set.
import { readFileSync } from 'node:fs'
import { generatePhasePlanData } from './src/features/workout/planGeneratorCore.ts'
import { getPhaseTemplates } from './src/features/workout/planTemplates.ts'
import type { AssessmentResponses } from './src/features/profile/types.ts'
import type { GoalMode, LibraryExercise } from './src/features/workout/planTypes.ts'

const library = JSON.parse(readFileSync('./_verify_lib.json', 'utf8')) as LibraryExercise[]
const pmById = new Map(library.map((e) => [e.id, e.primary_muscle]))
const nameById = new Map(library.map((e) => [e.id, e.name]))

function mkAssessment(o: {
  equipment: string[]; injuries: string; cannot_do: string[]
  preference: AssessmentResponses['preferences']['preference']; days: number
}): AssessmentResponses {
  return {
    basics: { display_name: '', age: null, sex: null, height_cm: null, current_weight_kg: null, target_weight_kg: null },
    goals: { primary: '', secondary: '', priorities: [] },
    training: { level: '', gym_months: null, frequency: null, sports: '' },
    availability: { days_per_week: o.days, session_minutes: 60, preferred_days: [], time: '' },
    equipment: o.equipment,
    preferences: { enjoy: [], cannot_do: o.cannot_do, injuries: o.injuries, preference: o.preference },
    lifestyle: { cardio_preference: [], daily_steps: null, sleep_hours: null, job_type: '' },
  }
}

// Representative inputs — CONFIRM against real assessments (SQL provided in chat).
const USERS: { label: string; goal: GoalMode; a: AssessmentResponses }[] = [
  { label: 'Person A (recomp)', goal: 'recomp',
    a: mkAssessment({ equipment: ['Full Commercial Gym'], injuries: 'cervical/neck pain, shoulder impingement', cannot_do: [], preference: 'machines', days: 5 }) },
  { label: 'Person B (cut)', goal: 'cut',
    a: mkAssessment({ equipment: ['Full Commercial Gym'], injuries: '', cannot_do: [], preference: 'mixed', days: 5 }) },
]

function expectedSlotsForPhase(goal: GoalMode, phase: number, days: number): number[] {
  const t = getPhaseTemplates(goal).find((p) => p.phaseNumber === phase)!
  return Array.from({ length: days }, (_, i) => t.days[i % t.days.length].slots.slice(0, 7).length)
}

for (const u of USERS) {
  console.log('\n' + '='.repeat(70))
  console.log(u.label + '  goal=' + u.goal)
  console.log('='.repeat(70))
  const phases = getPhaseTemplates(u.goal)
  let anyUnfilled = false
  const weekMuscleByPhase: Record<number, Record<string, number>> = {}

  for (const ph of phases) {
    const plan = generatePhasePlanData(u.a, u.goal, ph.phaseNumber, library)
    const expected = expectedSlotsForPhase(u.goal, ph.phaseNumber, u.a.availability.days_per_week)
    const muscle: Record<string, number> = {}
    let filledTotal = 0, expTotal = 0, unfilledDays: string[] = []
    plan.days.forEach((d, i) => {
      filledTotal += d.exercises.length; expTotal += expected[i]
      if (d.exercises.length < expected[i]) unfilledDays.push(`${d.label}(${d.exercises.length}/${expected[i]})`)
      for (const ex of d.exercises) {
        const pm = pmById.get(ex.ref.id) ?? '??' + ex.ref.id
        muscle[pm] = (muscle[pm] ?? 0) + ex.sets
      }
    })
    weekMuscleByPhase[ph.phaseNumber] = muscle
    const distinctDays = plan.days.length
    const unfilled = expTotal - filledTotal
    if (unfilled > 0) anyUnfilled = true
    console.log(`\n  Phase ${ph.phaseNumber} "${ph.name}": days=${distinctDays}, slots filled ${filledTotal}/${expTotal}` +
      (unfilled > 0 ? `  ⚠️ UNFILLED: ${unfilledDays.join(', ')}` : '  ✓ all filled'))
  }

  // Detail: report the 5-distinct-day hypertrophy phase (phase 2) per-muscle weekly sets
  const P = 2
  const m = weekMuscleByPhase[P]
  console.log(`\n  ── Phase ${P} weekly SETS per muscle (chosen exercise primary_muscle) ──`)
  const order = ['chest','upper_chest','front_delt','side_delt','rear_delt','lats','back','traps','biceps','triceps','quads','hamstrings','glutes','calves','core']
  let total = 0
  for (const k of order) if (m[k]) { console.log(`     ${k.padEnd(12)} ${m[k]}`); total += m[k] }
  for (const k of Object.keys(m)) if (!order.includes(k)) { console.log(`     ${k.padEnd(12)} ${m[k]} (unordered)`); total += m[k] }
  console.log(`     ${'TOTAL'.padEnd(12)} ${total}`)
  console.log(`\n  CHECKS: rear_delt>=6 -> ${m['rear_delt'] ?? 0} ${(m['rear_delt'] ?? 0) >= 6 ? 'PASS' : 'FAIL'}` +
    ` | calves>0 -> ${m['calves'] ?? 0} ${(m['calves'] ?? 0) > 0 ? 'PASS' : 'FAIL'}` +
    ` | no unfilled(all phases) -> ${anyUnfilled ? 'FAIL' : 'PASS'}`)
}

// Which exercises actually got picked for the delt/calf/back slots (spot check, Person A phase 2)
console.log('\n' + '='.repeat(70))
console.log('Spot-check: Person A phase 2 chosen exercises per day')
console.log('='.repeat(70))
const planA = generatePhasePlanData(USERS[0].a, 'recomp', 2, library)
for (const d of planA.days) {
  console.log(`  ${d.label}: ` + d.exercises.map((e) => nameById.get(e.ref.id) ?? e.ref.id).join(', '))
}
