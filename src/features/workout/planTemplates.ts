// Data-driven phase templates encoding AestheticFit-5month-training-architecture.md.
// Each phase -> ordered day templates -> ordered slots. A slot describes what it
// NEEDS (movement_pattern + target muscle + sets/reps/RIR/rest/progression) — the
// exerciseSelector fills it from exercise_library at generation time. Nothing here
// hardcodes an exercise id, and nothing here is keyed to "Person A/B" — only to
// nutrition_config.goal_mode, which the two seeded users happen to map to.

import type { DayTemplate, PhaseTemplate, ProgressionRule, SlotSpec } from './planTypes'

interface Tier {
  mainSets: number
  mainRir: number
  mainRest: number
  mainProgression: ProgressionRule
  accSets: number
  accRir: number
  accRest: number
  accProgression: ProgressionRule
}

function mainSlot(
  target: SlotSpec['target'],
  patterns: string[],
  repLow: number,
  repHigh: number,
  tier: Tier,
  note?: string,
): SlotSpec {
  return {
    target,
    movementPatterns: patterns,
    sets: tier.mainSets,
    repLow,
    repHigh,
    rir: tier.mainRir,
    restSeconds: tier.mainRest,
    progression: tier.mainProgression,
    note,
  }
}

function accSlot(
  target: SlotSpec['target'],
  patterns: string[],
  repLow: number,
  repHigh: number,
  tier: Tier,
  note?: string,
): SlotSpec {
  return {
    target,
    movementPatterns: patterns,
    sets: tier.accSets,
    repLow,
    repHigh,
    rir: tier.accRir,
    restSeconds: tier.accRest,
    progression: tier.accProgression,
    note,
  }
}

// Calf work is prescribed at a fixed 3×10-15 regardless of tier (per spec);
// tier still drives RIR/rest/progression so it tracks phase intensity.
function calfSlot(tier: Tier): SlotSpec {
  return {
    target: 'calves',
    movementPatterns: ['isolation'],
    sets: 3,
    repLow: 10,
    repHigh: 15,
    rir: tier.accRir,
    restSeconds: tier.accRest,
    progression: tier.accProgression,
  }
}

const PATTERNS = {
  chestPress: ['push', 'horizontal_press'],
  rowHorizontal: ['pull', 'horizontal_pull'],
  pulldownVertical: ['pull', 'vertical_pull'],
  overheadPress: ['push', 'vertical_press'],
  lateralRaise: ['isolation', 'lateral_raise'],
  rearDeltPull: ['isolation', 'horizontal_pull'],
  squat: ['squat'],
  hinge: ['hinge'],
  hipHinge: ['hinge', 'hip_hinge'],
  isolation: ['isolation'],
}

// ═══════════════════════════════════════════════════════════════════════
// PERSON A (recomp) — Foundation → Accumulation → Intensification → Peak
// ═══════════════════════════════════════════════════════════════════════

const A_TIERS: Record<'foundation' | 'accumulation' | 'intensification' | 'peak', Tier> = {
  foundation: { mainSets: 3, mainRir: 3, mainRest: 120, mainProgression: 'linear', accSets: 3, accRir: 3, accRest: 60, accProgression: 'double-progression' },
  accumulation: { mainSets: 3, mainRir: 2, mainRest: 120, mainProgression: 'linear', accSets: 3, accRir: 2, accRest: 60, accProgression: 'double-progression' },
  intensification: { mainSets: 3, mainRir: 1, mainRest: 150, mainProgression: 'double-progression', accSets: 3, accRir: 2, accRest: 60, accProgression: 'double-progression' },
  peak: { mainSets: 3, mainRir: 1, mainRest: 150, mainProgression: 'double-progression', accSets: 4, accRir: 1, accRest: 60, accProgression: 'double-progression' },
}

function upperDayA(tier: Tier): DayTemplate {
  return {
    label: 'Upper',
    split: 'upper_lower',
    slots: [
      mainSlot('upper_chest', PATTERNS.chestPress, 8, 12, tier),
      mainSlot('back', PATTERNS.rowHorizontal, 8, 12, tier, 'Chest-supported row preferred — no lower-back/neck bracing under load'),
      accSlot('lats', PATTERNS.pulldownVertical, 8, 12, tier, 'Lat width for the taper'),
      accSlot('side_delt', PATTERNS.lateralRaise, 12, 20, tier),
      accSlot('rear_delt', PATTERNS.rearDeltPull, 15, 20, tier, 'Mandatory prehab — shoulder health'),
      accSlot('biceps', PATTERNS.isolation, 10, 12, tier),
    ],
  }
}

function lowerDayA(tier: Tier): DayTemplate {
  return {
    label: 'Lower',
    split: 'upper_lower',
    slots: [
      mainSlot('quads', PATTERNS.squat, 8, 12, tier, 'Machine-biased (leg press/hack squat)'),
      mainSlot('hamstrings', PATTERNS.hinge, 8, 12, tier),
      accSlot('glutes', PATTERNS.hipHinge, 8, 12, tier),
      accSlot('quads', PATTERNS.isolation, 12, 15, tier),
      accSlot('hamstrings', PATTERNS.isolation, 10, 12, tier),
      calfSlot(tier),
      accSlot('core', PATTERNS.isolation, 8, 12, tier),
    ],
  }
}

function deltArmCoreDayA(tier: Tier): DayTemplate {
  return {
    label: 'Delt + Arm + Core',
    split: 'upper_lower',
    slots: [
      accSlot('side_delt', PATTERNS.lateralRaise, 12, 20, tier, 'Primary delt-frequency driver'),
      accSlot('side_delt', PATTERNS.lateralRaise, 15, 20, tier, 'Lengthened-partial finisher — no lateral raise above ~90° early'),
      accSlot('rear_delt', PATTERNS.rearDeltPull, 15, 20, tier),
      accSlot('biceps', PATTERNS.isolation, 10, 12, tier),
      accSlot('triceps', PATTERNS.isolation, 10, 12, tier),
      accSlot('core', PATTERNS.isolation, 8, 12, tier),
    ],
  }
}

function pushDayA(tier: Tier): DayTemplate {
  return {
    label: 'Push',
    split: 'ppl_upper_lower',
    slots: [
      mainSlot('upper_chest', PATTERNS.chestPress, 8, 10, tier),
      mainSlot('chest', PATTERNS.chestPress, 10, 12, tier),
      accSlot('side_delt', PATTERNS.lateralRaise, 12, 20, tier, 'Delt-frequency driver'),
      accSlot('front_delt', PATTERNS.overheadPress, 8, 10, tier, 'Neutral-grip/machine only — if pain-free'),
      accSlot('triceps', PATTERNS.isolation, 10, 12, tier),
      accSlot('rear_delt', PATTERNS.rearDeltPull, 15, 20, tier, 'Mandatory prehab — shoulder health'),
    ],
  }
}

function pullDayA(tier: Tier): DayTemplate {
  return {
    label: 'Pull',
    split: 'ppl_upper_lower',
    slots: [
      mainSlot('lats', PATTERNS.pulldownVertical, 8, 10, tier),
      mainSlot('back', PATTERNS.rowHorizontal, 10, 12, tier, 'Chest-supported row preferred'),
      accSlot('rear_delt', PATTERNS.rearDeltPull, 15, 15, tier, 'Mandatory prehab — shoulder health'),
      accSlot('rear_delt', PATTERNS.rearDeltPull, 15, 15, tier),
      accSlot('biceps', PATTERNS.isolation, 10, 12, tier),
      accSlot('side_delt', PATTERNS.lateralRaise, 12, 15, tier, 'Delt-frequency driver'),
    ],
  }
}

function legsDayA(tier: Tier): DayTemplate {
  return {
    label: 'Legs',
    split: 'ppl_upper_lower',
    slots: [
      mainSlot('quads', PATTERNS.squat, 10, 12, tier),
      mainSlot('hamstrings', PATTERNS.hinge, 8, 10, tier),
      accSlot('hamstrings', PATTERNS.isolation, 12, 12, tier),
      accSlot('quads', PATTERNS.isolation, 15, 15, tier),
      calfSlot(tier),
      accSlot('core', PATTERNS.isolation, 10, 12, tier),
    ],
  }
}

export const RECOMP_PHASES: PhaseTemplate[] = [
  {
    phaseNumber: 1,
    weekStart: 1,
    weekEnd: 5,
    name: 'Foundation',
    intent: 'Pattern mastery, neck-safe, work capacity. Machine-biased.',
    days: [upperDayA(A_TIERS.foundation), lowerDayA(A_TIERS.foundation), upperDayA(A_TIERS.foundation), lowerDayA(A_TIERS.foundation), deltArmCoreDayA(A_TIERS.foundation)],
    deloadWeek: null,
  },
  {
    phaseNumber: 2,
    weekStart: 6,
    weekEnd: 11,
    name: 'Accumulation',
    intent: 'Hypertrophy; volume ramps MEV→MAV; delt frequency peaks.',
    days: [pushDayA(A_TIERS.accumulation), pullDayA(A_TIERS.accumulation), legsDayA(A_TIERS.accumulation), upperDayA(A_TIERS.accumulation), lowerDayA(A_TIERS.accumulation)],
    deloadWeek: 11,
  },
  {
    phaseNumber: 3,
    weekStart: 12,
    weekEnd: 17,
    name: 'Intensification',
    intent: 'Strength foundation: double progression on primaries.',
    days: [pushDayA(A_TIERS.intensification), pullDayA(A_TIERS.intensification), legsDayA(A_TIERS.intensification), upperDayA(A_TIERS.intensification), lowerDayA(A_TIERS.intensification)],
    deloadWeek: 17,
  },
  {
    phaseNumber: 4,
    weekStart: 18,
    weekEnd: 22,
    name: 'Peak & Reveal',
    intent: 'Accessories near MRV → deload; slight deficit to reveal recomp.',
    days: [pushDayA(A_TIERS.peak), pullDayA(A_TIERS.peak), legsDayA(A_TIERS.peak), upperDayA(A_TIERS.peak), lowerDayA(A_TIERS.peak)],
    deloadWeek: 22,
  },
]

// ═══════════════════════════════════════════════════════════════════════
// PERSON B (cut) — Re-acclimation → Retention build → Deficit grind → Final push
// ═══════════════════════════════════════════════════════════════════════

const B_TIERS: Record<'reacclimation' | 'retention' | 'deficit' | 'final', Tier> = {
  reacclimation: { mainSets: 3, mainRir: 3, mainRest: 120, mainProgression: 'linear', accSets: 2, accRir: 3, accRest: 60, accProgression: 'double-progression' },
  retention: { mainSets: 3, mainRir: 2, mainRest: 120, mainProgression: 'linear', accSets: 3, accRir: 2, accRest: 60, accProgression: 'double-progression' },
  deficit: { mainSets: 3, mainRir: 2, mainRest: 120, mainProgression: 'linear', accSets: 3, accRir: 2, accRest: 60, accProgression: 'double-progression' },
  final: { mainSets: 3, mainRir: 1, mainRest: 120, mainProgression: 'double-progression', accSets: 3, accRir: 2, accRest: 60, accProgression: 'double-progression' },
}

function upperDayB(tier: Tier): DayTemplate {
  return {
    label: 'Upper',
    split: 'upper_lower',
    slots: [
      mainSlot('chest', PATTERNS.chestPress, 8, 10, tier),
      mainSlot('lats', PATTERNS.pulldownVertical, 6, 10, tier, 'Assisted pull-up / lat pulldown — pull-up progression'),
      accSlot('back', PATTERNS.rowHorizontal, 10, 10, tier),
      accSlot('front_delt', PATTERNS.overheadPress, 8, 10, tier),
      accSlot('side_delt', PATTERNS.lateralRaise, 15, 15, tier),
      accSlot('rear_delt', PATTERNS.rearDeltPull, 15, 20, tier, 'Rear-delt / prehab — shoulder health'),
      accSlot('triceps', PATTERNS.isolation, 12, 12, tier),
    ],
  }
}

function lowerDayB(tier: Tier): DayTemplate {
  return {
    label: 'Lower',
    split: 'upper_lower',
    slots: [
      mainSlot('glutes', PATTERNS.hipHinge, 8, 10, tier, 'Barbell hip thrust — joint-friendly, high-BF appropriate'),
      mainSlot('quads', PATTERNS.squat, 10, 10, tier, 'Leg press / goblet-to-box squat preferred over deep loaded barbell squat early'),
      accSlot('hamstrings', PATTERNS.isolation, 12, 12, tier),
      accSlot('quads', PATTERNS.squat, 10, 10, tier, 'Unilateral/single-leg accessory'),
      calfSlot(tier),
      accSlot('core', PATTERNS.isolation, 10, 12, tier),
    ],
  }
}

function pushDayB(tier: Tier): DayTemplate {
  return {
    label: 'Push',
    split: 'ppl_upper_lower',
    slots: [
      mainSlot('chest', PATTERNS.chestPress, 10, 10, tier),
      mainSlot('upper_chest', PATTERNS.chestPress, 10, 10, tier),
      accSlot('side_delt', PATTERNS.lateralRaise, 15, 15, tier),
      accSlot('triceps', PATTERNS.isolation, 12, 12, tier),
      accSlot('core', PATTERNS.isolation, 10, 12, tier, 'Incline push-up progression (AMRAP) — relative strength improves as BF falls'),
    ],
  }
}

function pullDayB(tier: Tier): DayTemplate {
  return {
    label: 'Pull',
    split: 'ppl_upper_lower',
    slots: [
      mainSlot('lats', PATTERNS.pulldownVertical, 8, 10, tier, 'Pull-up progression — track by assistance load falling'),
      accSlot('back', PATTERNS.rowHorizontal, 10, 10, tier, 'Chest-supported row'),
      accSlot('rear_delt', PATTERNS.rearDeltPull, 15, 15, tier, 'Mandatory prehab — shoulder health'),
      accSlot('rear_delt', PATTERNS.rearDeltPull, 15, 15, tier),
      accSlot('biceps', PATTERNS.isolation, 12, 12, tier),
    ],
  }
}

function legsDayB(tier: Tier): DayTemplate {
  return {
    label: 'Legs',
    split: 'ppl_upper_lower',
    slots: [
      mainSlot('quads', PATTERNS.squat, 8, 10, tier, 'Goblet/hack squat'),
      mainSlot('hamstrings', PATTERNS.hinge, 8, 10, tier),
      accSlot('quads', PATTERNS.isolation, 15, 15, tier),
      accSlot('hamstrings', PATTERNS.isolation, 12, 12, tier),
      calfSlot(tier),
      accSlot('core', PATTERNS.isolation, 10, 12, tier),
    ],
  }
}

export const CUT_PHASES: PhaseTemplate[] = [
  {
    phaseNumber: 1,
    weekStart: 1,
    weekEnd: 3,
    name: 'Re-acclimation',
    intent: 'Re-groove patterns, rebuild work capacity.',
    days: [upperDayB(B_TIERS.reacclimation), lowerDayB(B_TIERS.reacclimation)],
    deloadWeek: null,
  },
  {
    phaseNumber: 2,
    weekStart: 4,
    weekEnd: 11,
    name: 'Retention build',
    intent: 'Hard compounds; recomp window (build while cutting).',
    days: [upperDayB(B_TIERS.retention), lowerDayB(B_TIERS.retention), pushDayB(B_TIERS.retention), pullDayB(B_TIERS.retention), legsDayB(B_TIERS.retention)],
    deloadWeek: 11,
  },
  {
    phaseNumber: 3,
    weekStart: 12,
    weekEnd: 17,
    name: 'Deficit grind',
    intent: 'Hold lifts; trim a set if recovery flags; cardio ramps.',
    days: [upperDayB(B_TIERS.deficit), lowerDayB(B_TIERS.deficit), pushDayB(B_TIERS.deficit), pullDayB(B_TIERS.deficit), legsDayB(B_TIERS.deficit)],
    deloadWeek: null,
  },
  {
    phaseNumber: 4,
    weekStart: 18,
    weekEnd: 22,
    name: 'Final push',
    intent: 'Maintain lifts = proof of retention; finish the cut.',
    days: [upperDayB(B_TIERS.final), lowerDayB(B_TIERS.final), pushDayB(B_TIERS.final), pullDayB(B_TIERS.final), legsDayB(B_TIERS.final)],
    deloadWeek: 18,
  },
]

export function getPhaseTemplates(goalMode: 'recomp' | 'cut' | 'lean_bulk' | 'maintain'): PhaseTemplate[] {
  // lean_bulk/maintain aren't covered by the spec document (only recomp/cut are
  // profiled) — fall back to the recomp template, which is volume/frequency
  // moderate and neither aggressively cuts nor bulks.
  if (goalMode === 'cut') return CUT_PHASES
  return RECOMP_PHASES
}
