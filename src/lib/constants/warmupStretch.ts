// Curated warm-up (before) and stretch/cool-down (after) routines, keyed to the
// day's training focus. Resolved from the plan day's label (Push/Pull/Legs/
// Upper/Lower/…) via keyword match, so it works for both the deterministic
// generator's labels and arbitrary coach-authored ones, with a full-body
// fallback for anything unrecognised.
//
// Each item has a STABLE `key` — that's what completion is stored against in the
// DB (session_prep_logs.completed_keys), so renaming a `name` never orphans a
// user's checked-off history.

export interface RoutineItem {
  key: string
  name: string
  /** dose/how-to, e.g. "2 × 15" or "30s each side" */
  detail: string
}

// Plain-English "what this move is" for the less obvious names, keyed by the
// item `key` so a hint is written once even though a move appears in several
// routines. Names that are self-explanatory (arm circles, glute bridges) are
// left out — moveHint() returns undefined and the card shows no subtitle.
const MOVE_HINTS: Record<string, string> = {
  band_pull_apart: 'Hold a band in front of you and pull it apart to your chest — wakes up the upper back.',
  shoulder_dislocates: 'Hold a band/stick wide and sweep it over your head and behind you — opens the shoulders.',
  scap_pushup: 'Top of a push-up position; squeeze shoulder blades together and push apart, arms straight.',
  scap_pullup: 'Hang from a bar and just shrug down (no bend at the elbow) — preps the back for pulling.',
  cat_cow: 'On all fours, slowly round your back then arch it — gentle spine mobiliser.',
  thoracic_rot: 'Rotate your upper back to open the chest to one side, then the other.',
  upper_trap: 'Gently tilt your head to one side to stretch the side of your neck.',
  figure_four: 'Cross one ankle over the opposite knee and lean in — stretches the glute.',
  hip_circles: 'Big slow circles at the hip to loosen it up (90-90 = both knees bent at 90°, rotate side to side).',
  dead_bug: 'Lie on your back, lower opposite arm and leg slowly — core control drill.',
  cobra: 'Lie face-down and press your chest up, hips on the floor — stretches the abs.',
  pulse_raiser: 'Easy movement to raise your heart rate and warm the body before lifting.',
  light_press: 'A couple of easy sets with just the bar to groove the movement before working sets.',
  light_row: 'A couple of easy warm-up sets before your working weight.',
  light_squat_ramp: 'A couple of progressively heavier warm-up sets before your working weight.',
}

/** Plain-English hint for a warm-up/cool-down move, or undefined if none. */
export function moveHint(key: string): string | undefined {
  return MOVE_HINTS[key]
}

export interface DayRoutine {
  warmup: RoutineItem[]
  cooldown: RoutineItem[]
}

// Shared blocks so routines compose without repetition.
const GENERAL_PULSE: RoutineItem = { key: 'pulse_raiser', name: 'Light cardio pulse-raiser', detail: '5 min easy bike/walk' }

const PUSH: DayRoutine = {
  warmup: [
    GENERAL_PULSE,
    { key: 'arm_circles', name: 'Arm circles', detail: '30s each direction' },
    { key: 'band_pull_apart', name: 'Band pull-aparts', detail: '2 × 15' },
    { key: 'shoulder_dislocates', name: 'Shoulder dislocates (band/stick)', detail: '2 × 10' },
    { key: 'scap_pushup', name: 'Scapular push-ups', detail: '2 × 10' },
    { key: 'light_press', name: 'Empty-bar / light press', detail: '1–2 ramp-up sets' },
  ],
  cooldown: [
    { key: 'chest_doorway', name: 'Doorway chest stretch', detail: '30s each side' },
    { key: 'tricep_overhead', name: 'Overhead triceps stretch', detail: '30s each side' },
    { key: 'front_delt', name: 'Front-delt / behind-back stretch', detail: '30s' },
    { key: 'child_pose', name: "Child's pose", detail: '45s' },
  ],
}

const PULL: DayRoutine = {
  warmup: [
    GENERAL_PULSE,
    { key: 'band_pull_apart', name: 'Band pull-aparts', detail: '2 × 15' },
    { key: 'scap_pullup', name: 'Scapular pull-ups / dead hangs', detail: '2 × 8' },
    { key: 'cat_cow', name: 'Cat–cow', detail: '2 × 8' },
    { key: 'facepull_light', name: 'Light face-pulls', detail: '2 × 15' },
    { key: 'light_row', name: 'Light row ramp-up', detail: '1–2 sets' },
  ],
  cooldown: [
    { key: 'lat_stretch', name: 'Hanging / doorway lat stretch', detail: '30s each side' },
    { key: 'biceps_wall', name: 'Wall biceps stretch', detail: '30s each side' },
    { key: 'upper_trap', name: 'Upper-trap neck stretch', detail: '30s each side' },
    { key: 'thoracic_rot', name: 'Thoracic rotation', detail: '8 each side' },
  ],
}

const LEGS: DayRoutine = {
  warmup: [
    GENERAL_PULSE,
    { key: 'leg_swings', name: 'Leg swings (front + side)', detail: '10 each way' },
    { key: 'bodyweight_squat', name: 'Bodyweight squats', detail: '2 × 15' },
    { key: 'hip_circles', name: 'Hip circles / 90-90', detail: '8 each side' },
    { key: 'glute_bridge', name: 'Glute bridges', detail: '2 × 12' },
    { key: 'walking_lunge', name: 'Walking lunges', detail: '10 each leg' },
    { key: 'light_squat_ramp', name: 'Light squat ramp-up', detail: '2 sets' },
  ],
  cooldown: [
    { key: 'quad_stretch', name: 'Standing quad stretch', detail: '30s each side' },
    { key: 'hamstring_stretch', name: 'Seated hamstring stretch', detail: '30s each side' },
    { key: 'hip_flexor', name: 'Kneeling hip-flexor stretch', detail: '30s each side' },
    { key: 'calf_wall', name: 'Wall calf stretch', detail: '30s each side' },
    { key: 'figure_four', name: 'Figure-four glute stretch', detail: '30s each side' },
  ],
}

const UPPER: DayRoutine = {
  warmup: [
    GENERAL_PULSE,
    { key: 'arm_circles', name: 'Arm circles', detail: '30s each direction' },
    { key: 'band_pull_apart', name: 'Band pull-aparts', detail: '2 × 15' },
    { key: 'shoulder_dislocates', name: 'Shoulder dislocates (band/stick)', detail: '2 × 10' },
    { key: 'cat_cow', name: 'Cat–cow', detail: '2 × 8' },
    { key: 'scap_pushup', name: 'Scapular push-ups', detail: '2 × 10' },
  ],
  cooldown: [
    { key: 'chest_doorway', name: 'Doorway chest stretch', detail: '30s each side' },
    { key: 'lat_stretch', name: 'Lat stretch', detail: '30s each side' },
    { key: 'tricep_overhead', name: 'Overhead triceps stretch', detail: '30s each side' },
    { key: 'upper_trap', name: 'Upper-trap neck stretch', detail: '30s each side' },
  ],
}

const CORE_ARMS: DayRoutine = {
  warmup: [
    GENERAL_PULSE,
    { key: 'arm_circles', name: 'Arm circles', detail: '30s each direction' },
    { key: 'band_pull_apart', name: 'Band pull-aparts', detail: '2 × 15' },
    { key: 'dead_bug', name: 'Dead bugs', detail: '2 × 8 each side' },
    { key: 'wrist_prep', name: 'Wrist circles / prep', detail: '30s' },
  ],
  cooldown: [
    { key: 'cobra', name: 'Cobra / ab stretch', detail: '30s' },
    { key: 'biceps_wall', name: 'Wall biceps stretch', detail: '30s each side' },
    { key: 'tricep_overhead', name: 'Overhead triceps stretch', detail: '30s each side' },
    { key: 'side_bend', name: 'Standing side-bend', detail: '30s each side' },
  ],
}

const FULL_BODY: DayRoutine = {
  warmup: [
    GENERAL_PULSE,
    { key: 'arm_circles', name: 'Arm circles', detail: '30s each direction' },
    { key: 'leg_swings', name: 'Leg swings', detail: '10 each way' },
    { key: 'bodyweight_squat', name: 'Bodyweight squats', detail: '2 × 12' },
    { key: 'cat_cow', name: 'Cat–cow', detail: '2 × 8' },
    { key: 'band_pull_apart', name: 'Band pull-aparts', detail: '2 × 15' },
  ],
  cooldown: [
    { key: 'quad_stretch', name: 'Standing quad stretch', detail: '30s each side' },
    { key: 'hamstring_stretch', name: 'Hamstring stretch', detail: '30s each side' },
    { key: 'chest_doorway', name: 'Doorway chest stretch', detail: '30s each side' },
    { key: 'child_pose', name: "Child's pose", detail: '45s' },
  ],
}

// Ordered: first keyword that matches the label wins.
// Lower-body tokens MUST beat upper-body tokens — a coach label like
// "Lower B + Delts" would otherwise match /delt/ first and hand a squat day
// an arm-circle warm-up (B09 — injury risk). Match squat/hinge/leg cues
// (including "lower") BEFORE any upper-body vocab.
const FOCUS_MATCHERS: { test: RegExp; routine: DayRoutine }[] = [
  { test: /(lower|leg|quad|squat|hinge|hip|glute|ham|calf)/i, routine: LEGS },
  { test: /push/i, routine: PUSH },
  { test: /pull/i, routine: PULL },
  { test: /upper/i, routine: UPPER },
  { test: /(delt|arm|core|abs)/i, routine: CORE_ARMS },
]

/** Resolve a day's warm-up + cool-down routine from its plan label. */
export function routineForDay(label: string): DayRoutine {
  for (const m of FOCUS_MATCHERS) if (m.test.test(label)) return m.routine
  return FULL_BODY
}
