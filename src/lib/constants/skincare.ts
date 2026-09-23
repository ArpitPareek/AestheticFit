export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'

export interface RoutineStep {
  id: string
  product: string
  instruction?: string
  waitMinutes?: number
  onlyDays?: DayOfWeek[]
  note?: string
}

export interface DayRoutine {
  label: string
  steps: RoutineStep[]
}

export interface HairRoutine {
  steps: string[]
}

export interface SkinProfile {
  amRoutine: RoutineStep[]
  pmRoutines: Record<DayOfWeek, DayRoutine>
  hair: HairRoutine
}


// ─── Arpit ──────────────────────────────────────────────────

const ARPIT_AM: RoutineStep[] = [
  { id: 'a-am-1', product: 'CeraVe Cleanser', instruction: 'Gentle wash' },
  { id: 'a-am-2', product: 'Ceramide Mochi Toner', instruction: 'Pat onto damp skin' },
  { id: 'a-am-3', product: 'Anua Niacinamide', instruction: '2-3 drops, pat in', onlyDays: ['tuesday', 'thursday', 'friday', 'sunday'] },
  { id: 'a-am-4', product: 'Neutrogena Moisturizer', instruction: 'Thin layer' },
  { id: 'a-am-5', product: 'SPF 50+ Sunscreen', instruction: 'Generous application, reapply every 2-3 hrs outdoors' },
]

const ARPIT_PM_GLYCOLIC: DayRoutine = {
  label: 'Glycolic Acid Night',
  steps: [
    { id: 'a-pm-gly-1', product: 'CeraVe Cleanser', instruction: 'Gentle wash' },
    { id: 'a-pm-gly-2', product: 'Glycolic Acid', instruction: 'Apply evenly, avoid eyes' },
    { id: 'a-pm-gly-3', product: 'Wait', instruction: 'Let acid absorb', waitMinutes: 10 },
    { id: 'a-pm-gly-4', product: 'Moisturizer', instruction: 'Lock in hydration' },
  ],
}

const ARPIT_PM_TRET: DayRoutine = {
  label: 'Tretinoin Night',
  steps: [
    { id: 'a-pm-tret-1', product: 'CeraVe Cleanser', instruction: 'Gentle wash' },
    { id: 'a-pm-tret-2', product: 'Moisturizer', instruction: 'First layer (sandwich base)', note: 'Sandwich method: moisturizer protects skin from irritation' },
    { id: 'a-pm-tret-3', product: 'Tretinoin 0.05%', instruction: 'Pea-sized amount, avoid eyes/lips/nostrils' },
    { id: 'a-pm-tret-4', product: 'Wait', instruction: 'Let tretinoin absorb', waitMinutes: 15 },
    { id: 'a-pm-tret-5', product: 'Moisturizer', instruction: 'Second layer (sandwich seal)', note: 'Seals in tretinoin, reduces dryness' },
  ],
}

const ARPIT_PM_REST: DayRoutine = {
  label: 'Rest + Repair',
  steps: [
    { id: 'a-pm-rest-1', product: 'CeraVe Cleanser', instruction: 'Gentle wash' },
    { id: 'a-pm-rest-2', product: 'Snail Mucin', instruction: 'Apply on damp skin' },
    { id: 'a-pm-rest-3', product: 'Moisturizer', instruction: 'Generous layer — recovery night' },
  ],
}

const ARPIT_PM_RETINAL: DayRoutine = {
  label: 'Retinal Shot Night',
  steps: [
    { id: 'a-pm-ret-1', product: 'CeraVe Cleanser', instruction: 'Gentle wash' },
    { id: 'a-pm-ret-2', product: 'Celimax Retinal Shot', instruction: '2-3 drops' },
    { id: 'a-pm-ret-3', product: 'Wait', instruction: 'Let retinal absorb', waitMinutes: 10 },
    { id: 'a-pm-ret-4', product: 'Moisturizer', instruction: 'Lock in hydration' },
  ],
}

export const ARPIT_ROUTINE: SkinProfile = {
  amRoutine: ARPIT_AM,
  pmRoutines: {
    monday: ARPIT_PM_GLYCOLIC,
    tuesday: ARPIT_PM_TRET,
    wednesday: ARPIT_PM_GLYCOLIC,
    thursday: ARPIT_PM_TRET,
    friday: ARPIT_PM_REST,
    saturday: ARPIT_PM_RETINAL,
    sunday: ARPIT_PM_TRET,
  },
  hair: {
    steps: [
      'Oil hair 2x/week (before wash day)',
      "L'Oreal Shampoo on wash days",
      'Scalp massage daily (2-3 min)',
    ],
  },
}

// ─── Harshita ───────────────────────────────────────────────

const HARSHITA_AM: RoutineStep[] = [
  { id: 'h-am-1', product: 'CeraVe Hydrating Cleanser', instruction: 'Gentle wash' },
  { id: 'h-am-2', product: 'Rohto Melano CC (Vitamin C)', instruction: 'Apply, wait 1-2 min before next step', waitMinutes: 2 },
  { id: 'h-am-3', product: 'Tony Moly Ceramide Mochi Toner', instruction: 'Pat onto damp skin' },
  { id: 'h-am-4', product: 'Anua Niacinamide 10% + TXA', instruction: '2-3 drops, pat in' },
  { id: 'h-am-5', product: 'Neutrogena Hydro Boost Gel', instruction: 'Thin even layer' },
  { id: 'h-am-6', product: "Re'equil SPF 50 PA++++", instruction: 'Generous application' },
  { id: 'h-am-7', product: 'Body SPF', instruction: 'Apply on exposed areas' },
  { id: 'h-am-8', product: 'NMF Lip Balm', instruction: 'Apply to lips' },
]

const HARSHITA_PM_RETINOID: DayRoutine = {
  label: 'Retinoid Night',
  steps: [
    { id: 'h-pm-ret-1', product: 'Oil Cleanser', instruction: 'Double cleanse — step 1' },
    { id: 'h-pm-ret-2', product: 'CeraVe Cleanser', instruction: 'Double cleanse — step 2' },
    { id: 'h-pm-ret-3', product: 'Ceramide Toner', instruction: 'Pat onto damp skin' },
    { id: 'h-pm-ret-4', product: 'Celimax Retinal Shot', instruction: '2-3 drops', note: 'Week 3+: swap for Tretinoin 0.05% with sandwich method' },
    { id: 'h-pm-ret-5', product: 'Wait', instruction: 'Let retinoid absorb', waitMinutes: 10 },
    { id: 'h-pm-ret-6', product: 'Snail Mucin', instruction: 'Apply on damp skin' },
    { id: 'h-pm-ret-7', product: 'Moisturizer', instruction: 'Generous layer' },
    { id: 'h-pm-ret-8', product: 'Lip Mask', instruction: 'Apply before sleep' },
  ],
}

const HARSHITA_PM_RECOVERY: DayRoutine = {
  label: 'Recovery Night',
  steps: [
    { id: 'h-pm-rec-1', product: 'CeraVe Cleanser', instruction: 'Gentle wash' },
    { id: 'h-pm-rec-2', product: 'Snail Mucin', instruction: 'Apply generously on damp skin' },
    { id: 'h-pm-rec-3', product: 'Moisturizer', instruction: 'Generous layer — recovery night' },
  ],
}

const HARSHITA_PM_GLYCOLIC: DayRoutine = {
  label: 'Glycolic Acid Night',
  steps: [
    { id: 'h-pm-gly-1', product: 'Oil Cleanser', instruction: 'Double cleanse — step 1' },
    { id: 'h-pm-gly-2', product: 'CeraVe Cleanser', instruction: 'Double cleanse — step 2' },
    { id: 'h-pm-gly-3', product: 'Glycolic Acid', instruction: 'Face + body tan zones' },
    { id: 'h-pm-gly-4', product: 'Wait', instruction: 'Let acid absorb', waitMinutes: 10 },
    { id: 'h-pm-gly-5', product: 'Snail Mucin', instruction: 'Apply on damp skin' },
    { id: 'h-pm-gly-6', product: 'Moisturizer', instruction: 'Lock in hydration' },
  ],
}

const HARSHITA_PM_FRIDAY_RETINOID: DayRoutine = {
  label: 'Retinoid Night',
  steps: [
    { id: 'h-pm-fri-1', product: 'Oil Cleanser', instruction: 'Double cleanse — step 1' },
    { id: 'h-pm-fri-2', product: 'CeraVe Cleanser', instruction: 'Double cleanse — step 2' },
    { id: 'h-pm-fri-3', product: 'Ceramide Toner', instruction: 'Pat onto damp skin' },
    { id: 'h-pm-fri-4', product: 'Celimax Retinal Shot', instruction: '2-3 drops', note: 'Week 3+: swap for Tretinoin 0.05% with sandwich method' },
    { id: 'h-pm-fri-5', product: 'Wait', instruction: 'Let retinoid absorb', waitMinutes: 10 },
    { id: 'h-pm-fri-6', product: 'Snail Mucin', instruction: 'Apply on damp skin' },
    { id: 'h-pm-fri-7', product: 'Moisturizer', instruction: 'Generous layer' },
    { id: 'h-pm-fri-8', product: 'Lip Mask', instruction: 'Apply before sleep' },
  ],
}

export const HARSHITA_ROUTINE: SkinProfile = {
  amRoutine: HARSHITA_AM,
  pmRoutines: {
    monday: HARSHITA_PM_RETINOID,
    tuesday: HARSHITA_PM_RECOVERY,
    wednesday: HARSHITA_PM_RETINOID,
    thursday: HARSHITA_PM_GLYCOLIC,
    friday: HARSHITA_PM_FRIDAY_RETINOID,
    saturday: HARSHITA_PM_RECOVERY,
    sunday: HARSHITA_PM_RETINOID,
  },
  hair: {
    steps: [
      'Redensyl serum daily on scalp',
      "Wash 2x/week with L'Oreal Absolute Repair",
    ],
  },
}

export function getRoutineForProfile(sex: string | null): SkinProfile {
  return sex === 'female' ? HARSHITA_ROUTINE : ARPIT_ROUTINE
}

export function getDayOfWeek(date?: Date): DayOfWeek {
  const d = date ?? new Date()
  const days: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  return days[d.getDay()]
}

export function getAmStepsForDay(profile: SkinProfile, day: DayOfWeek): RoutineStep[] {
  return profile.amRoutine.filter(s => !s.onlyDays || s.onlyDays.includes(day))
}

export const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun',
}

export const DAY_ORDER: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
