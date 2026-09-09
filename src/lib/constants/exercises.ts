export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'biceps'
  | 'triceps'
  | 'core'
  | 'forearms'
  | 'calves'
  | 'full_body'
  | 'cardio'

export type MovementPattern = 'push' | 'pull' | 'hinge' | 'squat' | 'carry' | 'isolation'
export type Difficulty = 'beginner' | 'intermediate' | 'advanced'
export type EquipmentType =
  | 'barbell'
  | 'dumbbell'
  | 'cable'
  | 'machine'
  | 'bodyweight'
  | 'band'
  | 'kettlebell'
  | 'ab_wheel'
  | 'pull_up_bar'
  | 'treadmill'
  | 'stationary_bike'
  | 'elliptical'
  | 'none'

export interface Exercise {
  id: string
  name: string
  primary_muscle: MuscleGroup
  secondary_muscles: MuscleGroup[]
  equipment: EquipmentType[]
  movement_pattern: MovementPattern
  difficulty: Difficulty
  instructions: string
  form_cues: string[]
  common_mistakes: string[]
  youtube_search_url: string
  alternatives: string[]
  flags?: {
    behind_neck?: boolean
    heavy_grip_dependence?: boolean
  }
}

function youtubeSearchUrl(name: string): string {
  return `https://www.youtube.com/results?search_query=how+to+${name.replace(/[()\/]/g, '').replace(/\s+/g, '+').toLowerCase()}+proper+form`
}

export const EXERCISES: Exercise[] = [
  // ─── CHEST ───────────────────────────────────────────────
  {
    id: 'barbell-bench-press',
    name: 'Barbell Bench Press',
    primary_muscle: 'chest',
    secondary_muscles: ['triceps', 'shoulders'],
    equipment: ['barbell'],
    movement_pattern: 'push',
    difficulty: 'intermediate',
    instructions:
      'Lie on a flat bench with eyes under the bar. Grip slightly wider than shoulder-width. Unrack, lower the bar to mid-chest with elbows at ~45 degrees, then press up to lockout.',
    form_cues: [
      'Retract and depress shoulder blades',
      'Maintain slight arch in lower back',
      'Drive feet into the floor',
      'Bar path: slight diagonal from chest to over shoulders',
    ],
    common_mistakes: [
      'Flaring elbows to 90 degrees',
      'Bouncing bar off chest',
      'Lifting hips off the bench',
      'Uneven lockout',
    ],
    youtube_search_url: youtubeSearchUrl('Barbell Bench Press'),
    alternatives: ['dumbbell-bench-press', 'machine-chest-press', 'push-ups'],
  },
  {
    id: 'dumbbell-bench-press',
    name: 'Dumbbell Bench Press',
    primary_muscle: 'chest',
    secondary_muscles: ['triceps', 'shoulders'],
    equipment: ['dumbbell'],
    movement_pattern: 'push',
    difficulty: 'beginner',
    instructions:
      'Sit on a flat bench with dumbbells on thighs. Kick them up as you lie back. Press dumbbells up until arms are extended, then lower to chest level with elbows at ~45 degrees.',
    form_cues: [
      'Squeeze shoulder blades together throughout',
      'Keep wrists neutral, not bent back',
      'Lower until upper arms are parallel to floor',
      'Press in a slight arc, dumbbells nearly touching at top',
    ],
    common_mistakes: [
      'Going too heavy and losing control',
      'Flaring elbows wide',
      'Not using full range of motion',
      'Dropping dumbbells dangerously after set',
    ],
    youtube_search_url: youtubeSearchUrl('Dumbbell Bench Press'),
    alternatives: ['barbell-bench-press', 'machine-chest-press', 'push-ups'],
  },
  {
    id: 'incline-dumbbell-press',
    name: 'Incline Dumbbell Press',
    primary_muscle: 'chest',
    secondary_muscles: ['shoulders', 'triceps'],
    equipment: ['dumbbell'],
    movement_pattern: 'push',
    difficulty: 'intermediate',
    instructions:
      'Set bench to 30-45 degrees. Kick dumbbells up and press overhead. Lower with control until upper arms are parallel to the floor, then press back up.',
    form_cues: [
      'Keep back flat against the bench',
      'Bench angle 30-45 degrees, not higher',
      'Elbows at 45-degree angle to torso',
      'Full stretch at the bottom',
    ],
    common_mistakes: [
      'Setting bench too steep (becomes a shoulder press)',
      'Arching excessively off the bench',
      'Short range of motion',
      'Uneven pressing',
    ],
    youtube_search_url: youtubeSearchUrl('Incline Dumbbell Press'),
    alternatives: ['barbell-bench-press', 'machine-chest-press', 'cable-flyes'],
  },
  {
    id: 'machine-chest-press',
    name: 'Machine Chest Press',
    primary_muscle: 'chest',
    secondary_muscles: ['triceps', 'shoulders'],
    equipment: ['machine'],
    movement_pattern: 'push',
    difficulty: 'beginner',
    instructions:
      'Adjust seat height so handles are at mid-chest. Grip handles, push forward until arms are extended but not locked, then return slowly.',
    form_cues: [
      'Keep shoulder blades pinched back',
      'Do not lock elbows at extension',
      'Controlled tempo on the eccentric',
      'Feet flat on the floor',
    ],
    common_mistakes: [
      'Seat too high or too low',
      'Using momentum to push',
      'Locking out elbows aggressively',
      'Letting the weight stack slam',
    ],
    youtube_search_url: youtubeSearchUrl('Machine Chest Press'),
    alternatives: ['barbell-bench-press', 'dumbbell-bench-press', 'push-ups'],
  },
  {
    id: 'cable-flyes',
    name: 'Cable Flyes',
    primary_muscle: 'chest',
    secondary_muscles: ['shoulders'],
    equipment: ['cable'],
    movement_pattern: 'isolation',
    difficulty: 'intermediate',
    instructions:
      'Set cables at shoulder height. Step forward into a staggered stance. With a slight bend in the elbows, bring handles together in front of your chest in a hugging motion.',
    form_cues: [
      'Maintain slight elbow bend throughout',
      'Squeeze chest hard at the peak',
      'Control the stretch on the way back',
      'Keep torso stable, do not rotate',
    ],
    common_mistakes: [
      'Bending elbows too much (turns into a press)',
      'Using too much weight and losing form',
      'Leaning too far forward',
      'Rushing the eccentric',
    ],
    youtube_search_url: youtubeSearchUrl('Cable Flyes'),
    alternatives: ['dumbbell-flyes', 'dumbbell-bench-press', 'machine-chest-press'],
  },
  {
    id: 'push-ups',
    name: 'Push-ups',
    primary_muscle: 'chest',
    secondary_muscles: ['triceps', 'shoulders', 'core'],
    equipment: ['bodyweight'],
    movement_pattern: 'push',
    difficulty: 'beginner',
    instructions:
      'Start in a high plank with hands slightly wider than shoulders. Lower your body until chest nearly touches the floor, keeping body in a straight line. Push back up.',
    form_cues: [
      'Body in a straight line from head to heels',
      'Elbows at 45 degrees, not flared',
      'Full range of motion — chest to floor',
      'Squeeze glutes to prevent hip sag',
    ],
    common_mistakes: [
      'Sagging hips',
      'Flaring elbows to 90 degrees',
      'Not going low enough',
      'Leading with the chin instead of chest',
    ],
    youtube_search_url: youtubeSearchUrl('Push-ups'),
    alternatives: ['dumbbell-bench-press', 'machine-chest-press', 'barbell-bench-press'],
  },
  {
    id: 'dumbbell-flyes',
    name: 'Dumbbell Flyes',
    primary_muscle: 'chest',
    secondary_muscles: ['shoulders'],
    equipment: ['dumbbell'],
    movement_pattern: 'isolation',
    difficulty: 'intermediate',
    instructions:
      'Lie on a flat bench holding dumbbells above your chest with palms facing in. With a slight bend in elbows, lower the dumbbells in an arc until you feel a stretch. Return along the same arc.',
    form_cues: [
      'Keep elbows slightly bent throughout',
      'Feel the stretch at the bottom',
      'Squeeze chest to bring dumbbells together',
      'Controlled descent — do not drop arms',
    ],
    common_mistakes: [
      'Going too heavy',
      'Straightening arms fully (stresses elbows)',
      'Lowering too far past shoulder line',
      'Turning it into a press by bending elbows deeply',
    ],
    youtube_search_url: youtubeSearchUrl('Dumbbell Flyes'),
    alternatives: ['cable-flyes', 'machine-chest-press', 'push-ups'],
  },

  // ─── BACK ────────────────────────────────────────────────
  {
    id: 'barbell-row',
    name: 'Barbell Row',
    primary_muscle: 'back',
    secondary_muscles: ['biceps', 'shoulders', 'core'],
    equipment: ['barbell'],
    movement_pattern: 'pull',
    difficulty: 'intermediate',
    instructions:
      'Hinge at the hips with knees slightly bent, torso at ~45 degrees. Grip barbell slightly wider than shoulder-width. Pull the bar to your lower chest/upper abdomen, squeeze, then lower.',
    form_cues: [
      'Keep back flat — no rounding',
      'Initiate pull with elbows, not hands',
      'Squeeze shoulder blades at the top',
      'Torso angle stays constant throughout',
    ],
    common_mistakes: [
      'Rounding the lower back',
      'Using momentum to swing the weight up',
      'Standing too upright',
      'Pulling to the wrong position (too low or high)',
    ],
    youtube_search_url: youtubeSearchUrl('Barbell Row'),
    alternatives: ['dumbbell-row', 'cable-row', 't-bar-row'],
    flags: { heavy_grip_dependence: true },
  },
  {
    id: 'dumbbell-row',
    name: 'Dumbbell Row',
    primary_muscle: 'back',
    secondary_muscles: ['biceps', 'shoulders'],
    equipment: ['dumbbell'],
    movement_pattern: 'pull',
    difficulty: 'beginner',
    instructions:
      'Place one knee and hand on a bench. Hold a dumbbell in the other hand with arm extended. Pull the dumbbell to your hip, squeezing the shoulder blade back, then lower.',
    form_cues: [
      'Keep back flat and parallel to ground',
      'Pull to hip, not to chest',
      'Minimize torso rotation',
      'Full stretch at the bottom',
    ],
    common_mistakes: [
      'Rotating the torso to heave the weight',
      'Pulling to the armpit instead of hip',
      'Shrugging the shoulder up',
      'Using too much bicep, not enough back',
    ],
    youtube_search_url: youtubeSearchUrl('Dumbbell Row'),
    alternatives: ['barbell-row', 'cable-row', 't-bar-row'],
  },
  {
    id: 'lat-pulldown',
    name: 'Lat Pulldown',
    primary_muscle: 'back',
    secondary_muscles: ['biceps', 'shoulders'],
    equipment: ['cable'],
    movement_pattern: 'pull',
    difficulty: 'beginner',
    instructions:
      'Sit at a lat pulldown machine with thighs secured under pads. Grip the bar wider than shoulder-width. Pull the bar to your upper chest while leaning back slightly, then return slowly.',
    form_cues: [
      'Lean back slightly — about 15 degrees',
      'Drive elbows down and back',
      'Squeeze lats at the bottom',
      'Full stretch at the top — let lats lengthen',
    ],
    common_mistakes: [
      'Pulling behind the neck (injury risk)',
      'Leaning too far back',
      'Using biceps instead of lats',
      'Not getting full range of motion',
    ],
    youtube_search_url: youtubeSearchUrl('Lat Pulldown'),
    alternatives: ['pull-ups', 'dumbbell-row', 'cable-row'],
  },
  {
    id: 'cable-row',
    name: 'Cable Row (Seated)',
    primary_muscle: 'back',
    secondary_muscles: ['biceps', 'shoulders'],
    equipment: ['cable'],
    movement_pattern: 'pull',
    difficulty: 'beginner',
    instructions:
      'Sit at a cable row station with feet on the platform, knees slightly bent. Grip the handle, sit upright, and pull to your abdomen. Squeeze shoulder blades, then extend arms back.',
    form_cues: [
      'Keep chest up and back straight',
      'Pull to belly button level',
      'Squeeze shoulder blades at peak contraction',
      'Do not lean too far forward or back',
    ],
    common_mistakes: [
      'Excessive forward/backward rocking',
      'Rounding the upper back',
      'Shrugging shoulders up during the pull',
      'Using momentum instead of muscle',
    ],
    youtube_search_url: youtubeSearchUrl('Seated Cable Row'),
    alternatives: ['barbell-row', 'dumbbell-row', 't-bar-row'],
  },
  {
    id: 't-bar-row',
    name: 'T-Bar Row',
    primary_muscle: 'back',
    secondary_muscles: ['biceps', 'shoulders', 'core'],
    equipment: ['barbell'],
    movement_pattern: 'pull',
    difficulty: 'intermediate',
    instructions:
      'Straddle the T-bar with feet shoulder-width apart. Hinge at the hips, grip the handles, and pull the weight to your chest. Squeeze, then lower with control.',
    form_cues: [
      'Chest up, back flat',
      'Drive elbows past the torso',
      'Squeeze the back hard at the top',
      'Keep knees slightly bent',
    ],
    common_mistakes: [
      'Rounding the back',
      'Standing too upright',
      'Jerking the weight up',
      'Cutting range of motion short',
    ],
    youtube_search_url: youtubeSearchUrl('T-Bar Row'),
    alternatives: ['barbell-row', 'dumbbell-row', 'cable-row'],
    flags: { heavy_grip_dependence: true },
  },
  {
    id: 'pull-ups',
    name: 'Pull-ups / Assisted Pull-ups',
    primary_muscle: 'back',
    secondary_muscles: ['biceps', 'shoulders', 'core'],
    equipment: ['pull_up_bar'],
    movement_pattern: 'pull',
    difficulty: 'advanced',
    instructions:
      'Hang from a pull-up bar with palms facing away, slightly wider than shoulders. Pull yourself up until chin clears the bar, then lower with control. Use an assisted machine or band if needed.',
    form_cues: [
      'Initiate by depressing shoulder blades',
      'Drive elbows down toward hips',
      'Full dead hang at the bottom',
      'Chin over bar at the top',
    ],
    common_mistakes: [
      'Kipping or swinging',
      'Not achieving full range of motion',
      'Shrugging shoulders to ears',
      'Crossing legs and losing core tension',
    ],
    youtube_search_url: youtubeSearchUrl('Pull-ups'),
    alternatives: ['lat-pulldown', 'dumbbell-row', 'cable-row'],
    flags: { heavy_grip_dependence: true },
  },
  {
    id: 'face-pulls',
    name: 'Face Pulls',
    primary_muscle: 'shoulders',
    secondary_muscles: ['back'],
    equipment: ['cable'],
    movement_pattern: 'pull',
    difficulty: 'beginner',
    instructions:
      'Set a cable with rope attachment at upper chest height. Pull the rope toward your face, separating the ends as you pull. Externally rotate so hands end up beside your ears.',
    form_cues: [
      'High elbow position throughout',
      'Separate the rope ends as you pull',
      'Squeeze rear delts and external rotators',
      'Do not lean back excessively',
    ],
    common_mistakes: [
      'Using too much weight',
      'Pulling to the chest instead of face',
      'Not externally rotating at the end',
      'Leaning back to compensate',
    ],
    youtube_search_url: youtubeSearchUrl('Face Pulls'),
    alternatives: ['reverse-flyes', 'cable-lateral-raises', 'dumbbell-row'],
  },

  // ─── SHOULDERS ───────────────────────────────────────────
  {
    id: 'overhead-press-dumbbell',
    name: 'Overhead Press (Dumbbell)',
    primary_muscle: 'shoulders',
    secondary_muscles: ['triceps', 'core'],
    equipment: ['dumbbell'],
    movement_pattern: 'push',
    difficulty: 'intermediate',
    instructions:
      'Sit or stand with dumbbells at shoulder height, palms facing forward. Press the dumbbells overhead until arms are fully extended, then lower back to shoulders.',
    form_cues: [
      'Brace core tightly',
      'Press in a slight arc, not straight out',
      'Full lockout overhead',
      'Do not excessively arch the lower back',
    ],
    common_mistakes: [
      'Arching the back too much',
      'Pressing forward instead of up',
      'Not going through full range of motion',
      'Using leg drive unintentionally',
    ],
    youtube_search_url: youtubeSearchUrl('Dumbbell Overhead Press'),
    alternatives: ['machine-shoulder-press', 'lateral-raises', 'push-ups'],
  },
  {
    id: 'lateral-raises',
    name: 'Lateral Raises',
    primary_muscle: 'shoulders',
    secondary_muscles: [],
    equipment: ['dumbbell'],
    movement_pattern: 'isolation',
    difficulty: 'beginner',
    instructions:
      'Stand with dumbbells at your sides. Raise arms out to the sides until parallel with the floor, leading with the elbows. Lower with control.',
    form_cues: [
      'Slight bend in elbows throughout',
      'Lead with elbows, not hands',
      'Raise to shoulder height, no higher',
      'Controlled descent — no swinging',
    ],
    common_mistakes: [
      'Using too much weight and swinging',
      'Shrugging the traps to lift',
      'Raising above shoulder level',
      'Thumbs pointing up (reduces delt activation)',
    ],
    youtube_search_url: youtubeSearchUrl('Lateral Raises'),
    alternatives: ['cable-lateral-raises', 'machine-shoulder-press', 'overhead-press-dumbbell'],
  },
  {
    id: 'front-raises',
    name: 'Front Raises',
    primary_muscle: 'shoulders',
    secondary_muscles: ['chest'],
    equipment: ['dumbbell'],
    movement_pattern: 'isolation',
    difficulty: 'beginner',
    instructions:
      'Stand holding dumbbells in front of your thighs. Raise one or both arms straight in front to shoulder height. Lower with control.',
    form_cues: [
      'Keep a slight bend in the elbows',
      'Raise to shoulder height only',
      'Control the negative',
      'Keep torso still — no swinging',
    ],
    common_mistakes: [
      'Swinging the weight up',
      'Raising above shoulder level',
      'Arching the back',
      'Going too heavy',
    ],
    youtube_search_url: youtubeSearchUrl('Front Raises'),
    alternatives: ['overhead-press-dumbbell', 'lateral-raises', 'cable-lateral-raises'],
  },
  {
    id: 'reverse-flyes',
    name: 'Reverse Flyes (Rear Delt)',
    primary_muscle: 'shoulders',
    secondary_muscles: ['back'],
    equipment: ['dumbbell'],
    movement_pattern: 'isolation',
    difficulty: 'beginner',
    instructions:
      'Bend at the hips with back flat, dumbbells hanging below. Raise the dumbbells out to the sides, squeezing your rear delts. Lower slowly.',
    form_cues: [
      'Keep torso angle constant',
      'Slight elbow bend throughout',
      'Squeeze shoulder blades together at top',
      'Use light weight with strict form',
    ],
    common_mistakes: [
      'Using momentum to swing the weights',
      'Standing too upright',
      'Excessive elbow bending',
      'Shrugging the traps',
    ],
    youtube_search_url: youtubeSearchUrl('Reverse Flyes Rear Delt'),
    alternatives: ['face-pulls', 'cable-lateral-raises', 'dumbbell-row'],
  },
  {
    id: 'cable-lateral-raises',
    name: 'Cable Lateral Raises',
    primary_muscle: 'shoulders',
    secondary_muscles: [],
    equipment: ['cable'],
    movement_pattern: 'isolation',
    difficulty: 'beginner',
    instructions:
      'Stand sideways to a low cable pulley. Grab the handle with the far hand. Raise your arm out to the side until parallel to the floor, then lower with control.',
    form_cues: [
      'Constant tension throughout the rep',
      'Slight forward lean for better delt activation',
      'Lead with the elbow',
      'Controlled eccentric',
    ],
    common_mistakes: [
      'Turning it into a front raise',
      'Shrugging the trap',
      'Using body momentum',
      'Not controlling the negative',
    ],
    youtube_search_url: youtubeSearchUrl('Cable Lateral Raises'),
    alternatives: ['lateral-raises', 'overhead-press-dumbbell', 'machine-shoulder-press'],
  },
  {
    id: 'machine-shoulder-press',
    name: 'Machine Shoulder Press',
    primary_muscle: 'shoulders',
    secondary_muscles: ['triceps'],
    equipment: ['machine'],
    movement_pattern: 'push',
    difficulty: 'beginner',
    instructions:
      'Adjust seat so handles are at shoulder height. Press handles overhead until arms are extended, then lower back to start.',
    form_cues: [
      'Keep back flat against pad',
      'Do not lock elbows at the top',
      'Controlled tempo throughout',
      'Breathe out on the press',
    ],
    common_mistakes: [
      'Seat too low (overloads shoulders at bad angle)',
      'Locking elbows aggressively',
      'Lifting butt off the seat',
      'Using too much weight with partial reps',
    ],
    youtube_search_url: youtubeSearchUrl('Machine Shoulder Press'),
    alternatives: ['overhead-press-dumbbell', 'lateral-raises', 'push-ups'],
  },

  // ─── LEGS — QUADS ───────────────────────────────────────
  {
    id: 'barbell-squat',
    name: 'Barbell Squat',
    primary_muscle: 'quads',
    secondary_muscles: ['glutes', 'hamstrings', 'core'],
    equipment: ['barbell'],
    movement_pattern: 'squat',
    difficulty: 'intermediate',
    instructions:
      'Set barbell on upper traps. Unrack and step back. Feet shoulder-width apart, toes slightly out. Squat down until thighs are at least parallel, then drive up through your heels.',
    form_cues: [
      'Chest up throughout the movement',
      'Knees track over toes',
      'Hit parallel depth or below',
      'Drive through the whole foot',
    ],
    common_mistakes: [
      'Knees caving inward',
      'Leaning too far forward (good morning squat)',
      'Not hitting depth',
      'Rounding the lower back at the bottom',
    ],
    youtube_search_url: youtubeSearchUrl('Barbell Squat'),
    alternatives: ['leg-press', 'goblet-squat', 'hack-squat'],
  },
  {
    id: 'leg-press',
    name: 'Leg Press',
    primary_muscle: 'quads',
    secondary_muscles: ['glutes', 'hamstrings'],
    equipment: ['machine'],
    movement_pattern: 'squat',
    difficulty: 'beginner',
    instructions:
      'Sit in the leg press with feet shoulder-width on the platform. Release the safeties. Lower the platform by bending knees to ~90 degrees, then press back up.',
    form_cues: [
      'Keep lower back pressed into the pad',
      'Do not let knees cave inward',
      'Do not lock knees at the top',
      'Foot placement affects muscle emphasis',
    ],
    common_mistakes: [
      'Going too deep and rounding lower back',
      'Locking out knees',
      'Placing feet too high or low on the platform',
      'Using too much weight with half reps',
    ],
    youtube_search_url: youtubeSearchUrl('Leg Press'),
    alternatives: ['barbell-squat', 'goblet-squat', 'hack-squat'],
  },
  {
    id: 'goblet-squat',
    name: 'Goblet Squat',
    primary_muscle: 'quads',
    secondary_muscles: ['glutes', 'core'],
    equipment: ['dumbbell', 'kettlebell'],
    movement_pattern: 'squat',
    difficulty: 'beginner',
    instructions:
      'Hold a dumbbell or kettlebell at chest height with both hands. Squat down keeping the weight close to your body, elbows inside the knees. Stand back up.',
    form_cues: [
      'Keep the weight close to your chest',
      'Elbows between knees at the bottom',
      'Upright torso throughout',
      'Full depth — hip crease below knee',
    ],
    common_mistakes: [
      'Leaning forward',
      'Letting the weight drift away from the body',
      'Not going deep enough',
      'Knees caving inward',
    ],
    youtube_search_url: youtubeSearchUrl('Goblet Squat'),
    alternatives: ['barbell-squat', 'leg-press', 'bulgarian-split-squat'],
  },
  {
    id: 'leg-extension',
    name: 'Leg Extension',
    primary_muscle: 'quads',
    secondary_muscles: [],
    equipment: ['machine'],
    movement_pattern: 'isolation',
    difficulty: 'beginner',
    instructions:
      'Sit in the machine with the pad on your shins just above the ankles. Extend your legs until straight, squeeze the quads, then lower slowly.',
    form_cues: [
      'Squeeze the quads hard at full extension',
      'Controlled eccentric — 2-3 seconds down',
      'Keep back flat against the pad',
      'Adjust pad to sit just above ankles',
    ],
    common_mistakes: [
      'Using momentum to swing the weight',
      'Not achieving full extension',
      'Going too heavy with partial reps',
      'Lifting hips off the seat',
    ],
    youtube_search_url: youtubeSearchUrl('Leg Extension'),
    alternatives: ['barbell-squat', 'leg-press', 'goblet-squat'],
  },
  {
    id: 'bulgarian-split-squat',
    name: 'Bulgarian Split Squat',
    primary_muscle: 'quads',
    secondary_muscles: ['glutes', 'hamstrings'],
    equipment: ['dumbbell'],
    movement_pattern: 'squat',
    difficulty: 'intermediate',
    instructions:
      'Stand with one foot forward and the rear foot elevated on a bench behind you. Hold dumbbells at your sides. Lower until the front thigh is parallel to the floor, then drive up.',
    form_cues: [
      'Most weight on the front leg',
      'Front knee tracks over the toes',
      'Upright torso',
      'Control the descent — do not drop',
    ],
    common_mistakes: [
      'Front foot too close to the bench',
      'Leaning too far forward',
      'Rear foot doing too much work',
      'Knee collapsing inward',
    ],
    youtube_search_url: youtubeSearchUrl('Bulgarian Split Squat'),
    alternatives: ['barbell-squat', 'goblet-squat', 'leg-press'],
  },
  {
    id: 'hack-squat',
    name: 'Hack Squat',
    primary_muscle: 'quads',
    secondary_muscles: ['glutes', 'hamstrings'],
    equipment: ['machine'],
    movement_pattern: 'squat',
    difficulty: 'intermediate',
    instructions:
      'Stand in the hack squat machine with back against the pad, shoulders under the pads. Feet shoulder-width on the platform. Lower until thighs are parallel, then press back up.',
    form_cues: [
      'Keep back flat against the pad',
      'Knees track over toes',
      'Full range of motion',
      'Do not lock knees at the top',
    ],
    common_mistakes: [
      'Cutting depth short',
      'Placing feet too far forward or back',
      'Locking knees at extension',
      'Letting knees cave inward',
    ],
    youtube_search_url: youtubeSearchUrl('Hack Squat'),
    alternatives: ['barbell-squat', 'leg-press', 'goblet-squat'],
  },

  // ─── LEGS — HAMSTRINGS / GLUTES ─────────────────────────
  {
    id: 'romanian-deadlift',
    name: 'Romanian Deadlift',
    primary_muscle: 'hamstrings',
    secondary_muscles: ['glutes', 'back', 'core'],
    equipment: ['barbell', 'dumbbell'],
    movement_pattern: 'hinge',
    difficulty: 'intermediate',
    instructions:
      'Hold a barbell at hip height. Push hips back while keeping a slight knee bend, lowering the bar along your legs until you feel a deep hamstring stretch. Drive hips forward to stand.',
    form_cues: [
      'Hips go BACK, not down',
      'Bar stays close to the legs',
      'Slight knee bend — this is not a squat',
      'Feel the stretch in the hamstrings',
    ],
    common_mistakes: [
      'Rounding the lower back',
      'Bending the knees too much',
      'Bar drifting away from the body',
      'Not hinging enough at the hips',
    ],
    youtube_search_url: youtubeSearchUrl('Romanian Deadlift'),
    alternatives: ['leg-curl', 'hip-thrust', 'good-mornings'],
    flags: { heavy_grip_dependence: true },
  },
  {
    id: 'leg-curl',
    name: 'Leg Curl (Machine)',
    primary_muscle: 'hamstrings',
    secondary_muscles: [],
    equipment: ['machine'],
    movement_pattern: 'isolation',
    difficulty: 'beginner',
    instructions:
      'Lie face down on the leg curl machine. Adjust the pad to sit just above your ankles. Curl the weight up by bending your knees, squeeze at the top, then lower slowly.',
    form_cues: [
      'Keep hips pressed into the pad',
      'Full range of motion',
      'Squeeze hamstrings at peak contraction',
      'Controlled eccentric — 2-3 seconds',
    ],
    common_mistakes: [
      'Lifting hips off the pad',
      'Using momentum to swing the weight',
      'Not achieving full contraction',
      'Going too heavy with partial reps',
    ],
    youtube_search_url: youtubeSearchUrl('Leg Curl Machine'),
    alternatives: ['romanian-deadlift', 'good-mornings', 'cable-pull-through'],
  },
  {
    id: 'hip-thrust',
    name: 'Hip Thrust (Barbell)',
    primary_muscle: 'glutes',
    secondary_muscles: ['hamstrings', 'core'],
    equipment: ['barbell'],
    movement_pattern: 'hinge',
    difficulty: 'intermediate',
    instructions:
      'Sit on the floor with upper back against a bench, barbell over your hips (use a pad). Plant feet flat, drive hips up until your body forms a straight line from shoulders to knees. Squeeze glutes at the top.',
    form_cues: [
      'Drive through heels',
      'Squeeze glutes hard at the top',
      'Chin tucked — do not hyperextend the neck',
      'Knees at 90 degrees at the top',
    ],
    common_mistakes: [
      'Hyperextending the lower back at the top',
      'Feet too far forward or too close',
      'Not achieving full hip extension',
      'Pushing through toes instead of heels',
    ],
    youtube_search_url: youtubeSearchUrl('Barbell Hip Thrust'),
    alternatives: ['glute-bridge', 'cable-pull-through', 'romanian-deadlift'],
  },
  {
    id: 'glute-bridge',
    name: 'Glute Bridge',
    primary_muscle: 'glutes',
    secondary_muscles: ['hamstrings', 'core'],
    equipment: ['bodyweight', 'dumbbell'],
    movement_pattern: 'hinge',
    difficulty: 'beginner',
    instructions:
      'Lie on your back with knees bent and feet flat on the floor. Push hips up by squeezing glutes until body forms a straight line from shoulders to knees. Lower with control.',
    form_cues: [
      'Squeeze glutes at the top — hold for 1 second',
      'Drive through heels',
      'Keep core braced',
      'Do not hyperextend at the top',
    ],
    common_mistakes: [
      'Pushing through lower back instead of glutes',
      'Not squeezing at the top',
      'Feet too close or too far from hips',
      'Rushing through reps',
    ],
    youtube_search_url: youtubeSearchUrl('Glute Bridge'),
    alternatives: ['hip-thrust', 'banded-glute-bridge', 'cable-pull-through'],
  },
  {
    id: 'cable-pull-through',
    name: 'Cable Pull-through',
    primary_muscle: 'glutes',
    secondary_muscles: ['hamstrings', 'core'],
    equipment: ['cable'],
    movement_pattern: 'hinge',
    difficulty: 'beginner',
    instructions:
      'Face away from a low cable with rope between your legs. Hinge at the hips, letting the cable pull you back, then drive hips forward explosively to stand tall.',
    form_cues: [
      'This is a hip hinge — not a squat',
      'Arms stay straight throughout',
      'Squeeze glutes hard at the top',
      'Soft knees, do not bend them more as you hinge',
    ],
    common_mistakes: [
      'Squatting instead of hinging',
      'Pulling with the arms',
      'Not driving hips through fully',
      'Rounding the lower back',
    ],
    youtube_search_url: youtubeSearchUrl('Cable Pull Through'),
    alternatives: ['romanian-deadlift', 'hip-thrust', 'good-mornings'],
  },
  {
    id: 'good-mornings',
    name: 'Good Mornings',
    primary_muscle: 'hamstrings',
    secondary_muscles: ['glutes', 'back', 'core'],
    equipment: ['barbell'],
    movement_pattern: 'hinge',
    difficulty: 'intermediate',
    instructions:
      'Place a barbell on your upper back. With a slight knee bend, hinge at the hips and lower your torso until it is nearly parallel to the floor. Return to standing by driving hips forward.',
    form_cues: [
      'Keep back straight throughout',
      'Hinge at the hips, not the waist',
      'Feel the hamstring stretch',
      'Use lighter weight until form is solid',
    ],
    common_mistakes: [
      'Rounding the back',
      'Bending the knees too much',
      'Going too heavy too soon',
      'Not achieving full hip hinge',
    ],
    youtube_search_url: youtubeSearchUrl('Good Mornings Exercise'),
    alternatives: ['romanian-deadlift', 'leg-curl', 'cable-pull-through'],
  },

  // ─── ARMS ───────────────────────────────────────────────
  {
    id: 'barbell-curl',
    name: 'Barbell Curl',
    primary_muscle: 'biceps',
    secondary_muscles: ['forearms'],
    equipment: ['barbell'],
    movement_pattern: 'isolation',
    difficulty: 'beginner',
    instructions:
      'Stand holding a barbell with an underhand grip, arms fully extended. Curl the bar up to shoulder height by bending at the elbows. Lower slowly.',
    form_cues: [
      'Keep elbows pinned to your sides',
      'Squeeze biceps at the top',
      'Full extension at the bottom',
      'Controlled eccentric',
    ],
    common_mistakes: [
      'Swinging the body to cheat',
      'Elbows drifting forward',
      'Not using full range of motion',
      'Going too heavy with poor form',
    ],
    youtube_search_url: youtubeSearchUrl('Barbell Curl'),
    alternatives: ['dumbbell-curl', 'hammer-curl', 'cable-row'],
  },
  {
    id: 'dumbbell-curl',
    name: 'Dumbbell Curl',
    primary_muscle: 'biceps',
    secondary_muscles: ['forearms'],
    equipment: ['dumbbell'],
    movement_pattern: 'isolation',
    difficulty: 'beginner',
    instructions:
      'Stand or sit holding dumbbells at your sides with palms facing forward. Curl both dumbbells up to shoulder height, squeeze, then lower. Can be done alternating.',
    form_cues: [
      'Keep elbows stationary at your sides',
      'Supinate (turn palms up) as you curl',
      'Squeeze at the top for a moment',
      'Lower under control',
    ],
    common_mistakes: [
      'Swinging the weight',
      'Elbows moving forward and back',
      'Half reps — not extending fully',
      'Leaning back to lift heavier',
    ],
    youtube_search_url: youtubeSearchUrl('Dumbbell Curl'),
    alternatives: ['barbell-curl', 'hammer-curl', 'lat-pulldown'],
  },
  {
    id: 'hammer-curl',
    name: 'Hammer Curl',
    primary_muscle: 'biceps',
    secondary_muscles: ['forearms'],
    equipment: ['dumbbell'],
    movement_pattern: 'isolation',
    difficulty: 'beginner',
    instructions:
      'Stand holding dumbbells with a neutral grip (palms facing each other). Curl the dumbbells up to shoulder height while keeping the neutral grip. Lower slowly.',
    form_cues: [
      'Palms face each other throughout',
      'Elbows stay at your sides',
      'Squeeze at the top',
      'Do not swing',
    ],
    common_mistakes: [
      'Turning it into a regular curl by rotating wrists',
      'Swinging the body',
      'Elbows drifting forward',
      'Partial range of motion',
    ],
    youtube_search_url: youtubeSearchUrl('Hammer Curl'),
    alternatives: ['barbell-curl', 'dumbbell-curl', 'lat-pulldown'],
  },
  {
    id: 'tricep-pushdown',
    name: 'Tricep Pushdown (Cable)',
    primary_muscle: 'triceps',
    secondary_muscles: [],
    equipment: ['cable'],
    movement_pattern: 'isolation',
    difficulty: 'beginner',
    instructions:
      'Stand at a cable machine with a straight bar or rope at head height. Push the attachment down by extending your elbows until arms are fully straight. Return slowly.',
    form_cues: [
      'Keep elbows pinned to your sides',
      'Squeeze triceps at full extension',
      'Controlled eccentric — do not let the weight yank your arms up',
      'Slight forward lean for stability',
    ],
    common_mistakes: [
      'Elbows flaring or moving forward',
      'Using shoulders to press down',
      'Not achieving full extension',
      'Letting the weight stack slam',
    ],
    youtube_search_url: youtubeSearchUrl('Tricep Pushdown Cable'),
    alternatives: ['overhead-tricep-extension', 'skull-crushers', 'push-ups'],
  },
  {
    id: 'overhead-tricep-extension',
    name: 'Overhead Tricep Extension',
    primary_muscle: 'triceps',
    secondary_muscles: [],
    equipment: ['dumbbell', 'cable'],
    movement_pattern: 'isolation',
    difficulty: 'beginner',
    instructions:
      'Hold a dumbbell overhead with both hands. Lower it behind your head by bending at the elbows, keeping upper arms vertical. Extend back to the starting position.',
    form_cues: [
      'Keep upper arms close to your head',
      'Full stretch at the bottom',
      'Squeeze triceps at the top',
      'Core engaged to prevent arching',
    ],
    common_mistakes: [
      'Elbows flaring outward',
      'Arching the lower back',
      'Not going through full range of motion',
      'Using too much weight',
    ],
    youtube_search_url: youtubeSearchUrl('Overhead Tricep Extension'),
    alternatives: ['tricep-pushdown', 'skull-crushers', 'push-ups'],
  },
  {
    id: 'skull-crushers',
    name: 'Skull Crushers',
    primary_muscle: 'triceps',
    secondary_muscles: [],
    equipment: ['barbell', 'dumbbell'],
    movement_pattern: 'isolation',
    difficulty: 'intermediate',
    instructions:
      'Lie on a flat bench holding a barbell or dumbbells with arms extended over your chest. Lower the weight toward your forehead by bending at the elbows. Extend back up.',
    form_cues: [
      'Upper arms stay vertical — only forearms move',
      'Lower to forehead or just behind the head',
      'Controlled descent',
      'Squeeze triceps at the top',
    ],
    common_mistakes: [
      'Elbows flaring outward',
      'Dropping the weight too fast',
      'Upper arms swaying back and forth',
      'Using too much weight',
    ],
    youtube_search_url: youtubeSearchUrl('Skull Crushers'),
    alternatives: ['tricep-pushdown', 'overhead-tricep-extension', 'push-ups'],
  },

  // ─── CORE ───────────────────────────────────────────────
  {
    id: 'dead-bug',
    name: 'Dead Bug',
    primary_muscle: 'core',
    secondary_muscles: [],
    equipment: ['bodyweight'],
    movement_pattern: 'isolation',
    difficulty: 'beginner',
    instructions:
      'Lie on your back with arms extended toward the ceiling and knees bent at 90 degrees. Slowly extend one arm overhead and the opposite leg outward. Return and alternate.',
    form_cues: [
      'Press lower back flat into the floor throughout',
      'Move slowly and with control',
      'Breathe out as you extend',
      'Keep non-moving limbs stable',
    ],
    common_mistakes: [
      'Lower back arching off the floor',
      'Moving too quickly',
      'Not coordinating opposite arm/leg',
      'Holding breath',
    ],
    youtube_search_url: youtubeSearchUrl('Dead Bug Exercise'),
    alternatives: ['plank', 'bird-dog', 'hanging-leg-raise'],
  },
  {
    id: 'plank',
    name: 'Plank',
    primary_muscle: 'core',
    secondary_muscles: ['shoulders'],
    equipment: ['bodyweight'],
    movement_pattern: 'isolation',
    difficulty: 'beginner',
    instructions:
      'Start in a forearm plank position: elbows under shoulders, body in a straight line from head to heels. Hold the position, bracing your core.',
    form_cues: [
      'Straight line from head to heels',
      'Squeeze glutes and quads',
      'Do not let hips sag or pike up',
      'Breathe normally throughout',
    ],
    common_mistakes: [
      'Hips sagging toward the floor',
      'Hips piking up too high',
      'Looking forward (strains neck)',
      'Holding breath',
    ],
    youtube_search_url: youtubeSearchUrl('Plank Exercise'),
    alternatives: ['side-plank', 'dead-bug', 'bird-dog'],
  },
  {
    id: 'side-plank',
    name: 'Side Plank',
    primary_muscle: 'core',
    secondary_muscles: ['shoulders'],
    equipment: ['bodyweight'],
    movement_pattern: 'isolation',
    difficulty: 'beginner',
    instructions:
      'Lie on your side with elbow under shoulder and feet stacked. Lift hips off the ground to form a straight line. Hold.',
    form_cues: [
      'Hips stacked — do not rotate forward',
      'Straight line from head to feet',
      'Elbow directly under shoulder',
      'Breathe normally',
    ],
    common_mistakes: [
      'Hips dropping',
      'Rotating forward or backward',
      'Elbow too far from shoulder',
      'Holding breath',
    ],
    youtube_search_url: youtubeSearchUrl('Side Plank'),
    alternatives: ['plank', 'cable-woodchop', 'dead-bug'],
  },
  {
    id: 'cable-woodchop',
    name: 'Cable Woodchop',
    primary_muscle: 'core',
    secondary_muscles: ['shoulders'],
    equipment: ['cable'],
    movement_pattern: 'isolation',
    difficulty: 'intermediate',
    instructions:
      'Set a cable at the highest position. Stand sideways, grab the handle with both hands. Pull diagonally down and across your body, rotating your torso. Control back to start.',
    form_cues: [
      'Rotate through the core, not just the arms',
      'Keep arms relatively straight',
      'Control the return — do not let it snap back',
      'Pivot on the back foot',
    ],
    common_mistakes: [
      'Using only the arms',
      'Not controlling the eccentric',
      'Rounding the back',
      'Standing too close to the cable',
    ],
    youtube_search_url: youtubeSearchUrl('Cable Woodchop'),
    alternatives: ['side-plank', 'hanging-leg-raise', 'dead-bug'],
  },
  {
    id: 'hanging-leg-raise',
    name: 'Hanging Leg Raise',
    primary_muscle: 'core',
    secondary_muscles: [],
    equipment: ['pull_up_bar'],
    movement_pattern: 'isolation',
    difficulty: 'advanced',
    instructions:
      'Hang from a pull-up bar with arms extended. Raise your legs in front of you until parallel to the floor (or higher). Lower with control.',
    form_cues: [
      'Minimize swinging',
      'Curl pelvis up — do not just lift legs',
      'Controlled descent',
      'Keep legs as straight as possible',
    ],
    common_mistakes: [
      'Swinging to generate momentum',
      'Only lifting legs without pelvic tilt',
      'Dropping legs on the way down',
      'Bending knees excessively',
    ],
    youtube_search_url: youtubeSearchUrl('Hanging Leg Raise'),
    alternatives: ['dead-bug', 'plank', 'ab-wheel-rollout'],
    flags: { heavy_grip_dependence: true },
  },
  {
    id: 'ab-wheel-rollout',
    name: 'Ab Wheel Rollout',
    primary_muscle: 'core',
    secondary_muscles: ['shoulders'],
    equipment: ['ab_wheel'],
    movement_pattern: 'isolation',
    difficulty: 'intermediate',
    instructions:
      'Kneel on the floor holding an ab wheel. Roll forward, extending your body as far as you can while keeping your core tight. Pull back to the starting position.',
    form_cues: [
      'Brace core — do not let lower back sag',
      'Tuck pelvis slightly',
      'Only go as far as you can control',
      'Squeeze abs to pull back',
    ],
    common_mistakes: [
      'Letting the lower back collapse',
      'Going too far before building strength',
      'Leading with the hips on the return',
      'Not engaging the core throughout',
    ],
    youtube_search_url: youtubeSearchUrl('Ab Wheel Rollout'),
    alternatives: ['plank', 'dead-bug', 'hanging-leg-raise'],
  },
  {
    id: 'bird-dog',
    name: 'Bird Dog',
    primary_muscle: 'core',
    secondary_muscles: ['glutes'],
    equipment: ['bodyweight'],
    movement_pattern: 'isolation',
    difficulty: 'beginner',
    instructions:
      'Start on all fours. Extend one arm forward and the opposite leg back, forming a straight line. Hold briefly, then return. Alternate sides.',
    form_cues: [
      'Keep hips level — no rotation',
      'Extend fully through fingertips and heel',
      'Move slowly and deliberately',
      'Brace core throughout',
    ],
    common_mistakes: [
      'Rotating hips to one side',
      'Arching the lower back',
      'Rushing through reps',
      'Not extending fully',
    ],
    youtube_search_url: youtubeSearchUrl('Bird Dog Exercise'),
    alternatives: ['dead-bug', 'plank', 'side-plank'],
  },

  // ─── GLUTE ACTIVATION (Warm-up) ─────────────────────────
  {
    id: 'clamshell',
    name: 'Clamshell',
    primary_muscle: 'glutes',
    secondary_muscles: [],
    equipment: ['band', 'bodyweight'],
    movement_pattern: 'isolation',
    difficulty: 'beginner',
    instructions:
      'Lie on your side with knees bent at 45 degrees and feet together. Open the top knee like a clamshell while keeping feet touching. Lower with control.',
    form_cues: [
      'Keep feet together throughout',
      'Do not rotate the pelvis backward',
      'Squeeze the glute at the top',
      'Controlled tempo',
    ],
    common_mistakes: [
      'Rolling the hips back to cheat',
      'Moving too fast',
      'Not squeezing at the top',
      'Feet separating',
    ],
    youtube_search_url: youtubeSearchUrl('Clamshell Exercise'),
    alternatives: ['banded-glute-bridge', 'fire-hydrant', 'donkey-kick'],
  },
  {
    id: 'banded-glute-bridge',
    name: 'Banded Glute Bridge',
    primary_muscle: 'glutes',
    secondary_muscles: ['hamstrings'],
    equipment: ['band'],
    movement_pattern: 'hinge',
    difficulty: 'beginner',
    instructions:
      'Place a resistance band just above your knees. Lie on your back with knees bent. Drive hips up while pressing knees outward against the band. Squeeze at the top, lower slowly.',
    form_cues: [
      'Press knees outward against the band throughout',
      'Squeeze glutes hard at the top',
      'Drive through heels',
      'Keep core braced',
    ],
    common_mistakes: [
      'Letting knees cave in',
      'Pushing through toes',
      'Not squeezing at the top',
      'Arching lower back instead of driving hips',
    ],
    youtube_search_url: youtubeSearchUrl('Banded Glute Bridge'),
    alternatives: ['glute-bridge', 'clamshell', 'fire-hydrant'],
  },
  {
    id: 'fire-hydrant',
    name: 'Fire Hydrant',
    primary_muscle: 'glutes',
    secondary_muscles: [],
    equipment: ['bodyweight', 'band'],
    movement_pattern: 'isolation',
    difficulty: 'beginner',
    instructions:
      'Start on all fours. Keeping the knee bent at 90 degrees, lift one leg out to the side until the thigh is parallel to the floor. Lower with control.',
    form_cues: [
      'Keep hips level — do not shift weight',
      'Lift with the glute, not the hip flexor',
      'Keep core engaged',
      'Controlled movement throughout',
    ],
    common_mistakes: [
      'Shifting the entire body to one side',
      'Rotating the hips open',
      'Moving too quickly',
      'Arching the back',
    ],
    youtube_search_url: youtubeSearchUrl('Fire Hydrant Exercise'),
    alternatives: ['clamshell', 'donkey-kick', 'banded-glute-bridge'],
  },
  {
    id: 'donkey-kick',
    name: 'Donkey Kick',
    primary_muscle: 'glutes',
    secondary_muscles: ['hamstrings'],
    equipment: ['bodyweight', 'band'],
    movement_pattern: 'isolation',
    difficulty: 'beginner',
    instructions:
      'Start on all fours. Keeping the knee bent at 90 degrees, drive one foot up toward the ceiling until the thigh is in line with the torso. Lower with control.',
    form_cues: [
      'Keep the knee bent at 90 degrees throughout',
      'Squeeze the glute at the top',
      'Do not arch the lower back',
      'Keep core tight and hips level',
    ],
    common_mistakes: [
      'Arching the lower back to get the leg higher',
      'Using momentum instead of glute contraction',
      'Rotating the hips',
      'Not squeezing at the top',
    ],
    youtube_search_url: youtubeSearchUrl('Donkey Kick Exercise'),
    alternatives: ['fire-hydrant', 'clamshell', 'banded-glute-bridge'],
  },

  // ─── CARDIO ─────────────────────────────────────────────
  {
    id: 'treadmill-walk-incline',
    name: 'Treadmill Walk (Incline)',
    primary_muscle: 'cardio',
    secondary_muscles: ['glutes', 'calves'],
    equipment: ['treadmill'],
    movement_pattern: 'carry',
    difficulty: 'beginner',
    instructions:
      'Set the treadmill to an incline of 8-15%. Walk at a moderate pace (5-6 km/h). Keep an upright posture and do not hold the handrails.',
    form_cues: [
      'Upright posture — do not lean on handles',
      'Swing arms naturally',
      'Push through the whole foot',
      'Maintain a brisk but conversational pace',
    ],
    common_mistakes: [
      'Holding the handrails (reduces calorie burn significantly)',
      'Leaning forward into the belt',
      'Setting speed too high for the incline',
      'Slouching or looking down at phone',
    ],
    youtube_search_url: youtubeSearchUrl('Incline Treadmill Walk'),
    alternatives: ['stationary-bike', 'elliptical', 'swimming'],
  },
  {
    id: 'stationary-bike',
    name: 'Stationary Bike',
    primary_muscle: 'cardio',
    secondary_muscles: ['quads', 'hamstrings'],
    equipment: ['stationary_bike'],
    movement_pattern: 'carry',
    difficulty: 'beginner',
    instructions:
      'Adjust the seat so your knee has a slight bend at the bottom of the pedal stroke. Pedal at a steady cadence. Adjust resistance to maintain the desired heart rate zone.',
    form_cues: [
      'Seat height: slight knee bend at bottom',
      'Keep upper body relaxed, not hunched',
      'Pedal through full circles, not just pushing down',
      'Maintain steady cadence (60-90 RPM)',
    ],
    common_mistakes: [
      'Seat too low or too high',
      'Gripping handlebars too tightly',
      'Bouncing in the saddle (resistance too low)',
      'Hunching shoulders',
    ],
    youtube_search_url: youtubeSearchUrl('Stationary Bike Workout'),
    alternatives: ['treadmill-walk-incline', 'elliptical', 'swimming'],
  },
  {
    id: 'elliptical',
    name: 'Elliptical',
    primary_muscle: 'cardio',
    secondary_muscles: ['quads', 'glutes'],
    equipment: ['elliptical'],
    movement_pattern: 'carry',
    difficulty: 'beginner',
    instructions:
      'Step onto the elliptical and grip the moving handles. Pedal in a smooth, circular motion while pushing and pulling the handles. Adjust resistance as needed.',
    form_cues: [
      'Stand upright — do not lean on the console',
      'Push through the heels, not the toes',
      'Use both arms and legs',
      'Keep a smooth, steady rhythm',
    ],
    common_mistakes: [
      'Leaning on the machine',
      'Only using the legs (ignoring handles)',
      'Setting resistance too low',
      'Choppy, uneven strides',
    ],
    youtube_search_url: youtubeSearchUrl('Elliptical Workout'),
    alternatives: ['treadmill-walk-incline', 'stationary-bike', 'swimming'],
  },
  {
    id: 'swimming',
    name: 'Swimming',
    primary_muscle: 'cardio',
    secondary_muscles: ['back', 'shoulders', 'core'],
    equipment: ['none'],
    movement_pattern: 'carry',
    difficulty: 'intermediate',
    instructions:
      'Swim laps using any stroke (freestyle is most common). Focus on breathing rhythm and consistent stroke technique. Start with shorter intervals and build up.',
    form_cues: [
      'Exhale underwater, inhale to the side',
      'Keep body streamlined',
      'Rotate the torso with each stroke',
      'Kick from the hips, not the knees',
    ],
    common_mistakes: [
      'Holding breath instead of exhaling underwater',
      'Lifting head too high to breathe',
      'Kicking from the knees',
      'Crossing over with the hand entry',
    ],
    youtube_search_url: youtubeSearchUrl('Swimming Freestyle Technique'),
    alternatives: ['treadmill-walk-incline', 'stationary-bike', 'elliptical'],
  },
  {
    id: 'badminton',
    name: 'Badminton',
    primary_muscle: 'cardio',
    secondary_muscles: ['shoulders', 'quads', 'core'],
    equipment: ['none'],
    movement_pattern: 'carry',
    difficulty: 'beginner',
    instructions:
      'Play singles or doubles badminton. Focus on quick footwork, proper grip, and explosive movements. Great for HIIT-style cardio with natural intervals.',
    form_cues: [
      'Stay on the balls of your feet',
      'Return to base position after each shot',
      'Use wrist snap for power, not full arm',
      'Keep racket up between shots',
    ],
    common_mistakes: [
      'Flat-footed stance',
      'Not returning to center court',
      'Using arm strength instead of wrist technique',
      'Gripping the racket too tightly',
    ],
    youtube_search_url: youtubeSearchUrl('Badminton Basics'),
    alternatives: ['swimming', 'treadmill-walk-incline', 'stationary-bike'],
  },
]

export const EXERCISE_MAP = new Map(EXERCISES.map((e) => [e.id, e]))

export function getExerciseById(id: string): Exercise | undefined {
  return EXERCISE_MAP.get(id)
}

export function getExercisesByMuscle(muscle: MuscleGroup): Exercise[] {
  return EXERCISES.filter(
    (e) => e.primary_muscle === muscle || e.secondary_muscles.includes(muscle)
  )
}

export function getExercisesByEquipment(equipment: EquipmentType): Exercise[] {
  return EXERCISES.filter((e) => e.equipment.includes(equipment))
}

export function getExercisesByMovement(pattern: MovementPattern): Exercise[] {
  return EXERCISES.filter((e) => e.movement_pattern === pattern)
}

export function getSafeExercises(): Exercise[] {
  return EXERCISES.filter(
    (e) => !e.flags?.behind_neck && !e.flags?.heavy_grip_dependence
  )
}
