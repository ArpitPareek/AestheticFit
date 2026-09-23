-- 020_canonical_exercise_library.sql
-- Canonical ~55-movement exercise_library reseed. Idempotent: INSERT ... ON
-- CONFLICT (id) DO UPDATE upserts every row and remaps the 4 existing
-- non-canonical rows in place (no duplicates). Movement_pattern + primary_muscle
-- speak the planTemplates/exerciseSelector vocabulary verbatim.
-- Media: static jpgs vendored from yuhonas/free-exercise-db (Unlicense/public domain).
-- Cues follow the migration-017 jsonb shape.
--
-- Deprecated (global exclusion, preserved for history/vocab): behind-neck-press,
-- behind-neck-pulldown, upright-row.

insert into exercise_library
  (id, name, primary_muscle, movement_pattern, equipment, difficulty,
   stability_demand, sfr_rating, contraindications, deprecated, cues,
   gif_url, media_attribution, media_license)
values
  ('barbell-bench-press', 'Barbell Bench Press', 'chest', 'horizontal_press', array['barbell','bench'], 'intermediate',
   'medium', 3, array['shoulder'], false, jsonb_build_object('setup', jsonb_build_array('Eyes under the bar, grip just wider than shoulders', 'Retract and depress the shoulder blades, slight arch, feet planted'), 'execution', jsonb_build_array('Lower the bar to the mid-chest with elbows ~45°, not flared to 90°', 'Press up and slightly back to over the shoulders; stop just short of lockout'), 'breathing', 'Big breath at the top, brace, exhale through the sticking point', 'common_mistakes', jsonb_build_array('Flaring elbows to 90 degrees', 'Bouncing bar off chest', 'Lifting hips off the bench', 'Uneven lockout'), 'ruin_your_gains', jsonb_build_array('Flared elbows + a bouncing bar is how the shoulder gets cranky — control the descent to the chest')),
   '/exercise-media/barbell-bench-press/0.jpg', 'free-exercise-db (yuhonas)', 'Unlicense (public domain)'),

  ('dumbbell-bench-press', 'Dumbbell Bench Press', 'chest', 'horizontal_press', array['dumbbell','bench'], 'beginner',
   'medium', 4, array[]::text[], false, jsonb_build_object('setup', jsonb_build_array('Kick the dumbbells up as you lie back', 'Shoulder blades squeezed together, wrists neutral'), 'execution', jsonb_build_array('Lower until the upper arms are roughly parallel to the floor for a deep stretch', 'Press up in a slight arc, dumbbells nearly touching at the top'), 'breathing', 'Inhale on the way down, exhale as you press', 'common_mistakes', jsonb_build_array('Going too heavy and losing control', 'Flaring elbows wide', 'Not using full range of motion', 'Dropping dumbbells dangerously after set'), 'ruin_your_gains', jsonb_build_array('Half-reps rob the stretched bottom position where most of the chest growth happens')),
   '/exercise-media/dumbbell-bench-press/0.jpg', 'free-exercise-db (yuhonas)', 'Unlicense (public domain)'),

  ('machine-chest-press', 'Machine Chest Press', 'chest', 'horizontal_press', array['machine'], 'beginner',
   'low', 5, array[]::text[], false, jsonb_build_object('setup', jsonb_build_array('Set the seat so the handles line up with the mid-chest', 'Shoulder blades back and down against the pad'), 'execution', jsonb_build_array('Press out until nearly locked, staying just short of full extension to keep tension', 'Return under control to a comfortable stretch'), 'breathing', 'Exhale on the press, inhale on the return', 'common_mistakes', jsonb_build_array('Seat too high or too low', 'Using momentum to push', 'Locking out elbows aggressively', 'Letting the weight stack slam'), 'ruin_your_gains', jsonb_build_array('Shrugging the shoulders forward turns a clean chest press into a front-delt grind')),
   '/exercise-media/machine-chest-press/0.jpg', 'free-exercise-db (yuhonas)', 'Unlicense (public domain)'),

  ('cable-flyes', 'Cable Flyes', 'chest', 'horizontal_press', array['cable'], 'intermediate',
   'low', 4, array[]::text[], false, jsonb_build_object('setup', jsonb_build_array('Pulleys set at ~chest height, soft bend in the elbows', 'Slight forward lean, one foot staggered for balance'), 'execution', jsonb_build_array('Bring the handles together in a hugging arc, squeeze at the midline', 'Open back to a controlled stretch — feel it across the chest, not the shoulder'), 'breathing', 'Exhale as the hands come together, inhale on the stretch', 'common_mistakes', jsonb_build_array('Bending elbows too much (turns into a press)', 'Using too much weight and losing form', 'Leaning too far forward', 'Rushing the eccentric'), 'ruin_your_gains', jsonb_build_array('Chasing weight collapses the arc into a press and the chest stops doing the work')),
   '/exercise-media/cable-flyes/0.jpg', 'free-exercise-db (yuhonas)', 'Unlicense (public domain)'),

  ('dumbbell-flyes', 'Dumbbell Flyes', 'chest', 'horizontal_press', array['dumbbell','bench'], 'intermediate',
   'medium', 3, array['shoulder'], false, jsonb_build_object('setup', jsonb_build_array('Lie back with a soft, fixed bend in the elbows', 'Shoulder blades retracted'), 'execution', jsonb_build_array('Lower the dumbbells out in a wide arc to a chest-level stretch — no deeper', 'Bring them back together over the chest, keeping the elbow angle fixed'), 'breathing', 'Inhale as you open, exhale as you close', 'common_mistakes', jsonb_build_array('Going too heavy', 'Straightening arms fully (stresses elbows)', 'Lowering too far past shoulder line', 'Turning it into a press by bending elbows deeply'), 'ruin_your_gains', jsonb_build_array('Going below a comfortable stretch loads the shoulder capsule, not the chest — stop at chest level')),
   '/exercise-media/dumbbell-flyes/0.jpg', 'free-exercise-db (yuhonas)', 'Unlicense (public domain)'),

  ('push-ups', 'Push-ups', 'chest', 'horizontal_press', array['bodyweight'], 'beginner',
   'medium', 3, array['wrist'], false, jsonb_build_object('setup', jsonb_build_array('Hands just wider than the shoulders, fingers spread', 'Ribs down, glutes and abs braced into a straight line'), 'execution', jsonb_build_array('Lower the chest to just off the floor, elbows ~45°', 'Press away to just short of lockout, body rigid throughout'), 'breathing', 'Inhale down, exhale up', 'common_mistakes', jsonb_build_array('Sagging hips', 'Flaring elbows to 90 degrees', 'Not going low enough', 'Leading with the chin instead of chest'), 'ruin_your_gains', jsonb_build_array('A sagging hip turns this into a lower-back hang instead of a chest exercise — stay a plank the whole time')),
   '/exercise-media/push-ups/0.jpg', 'free-exercise-db (yuhonas)', 'Unlicense (public domain)'),

  ('incline-dumbbell-press', 'Incline Dumbbell Press (30°)', 'upper_chest', 'horizontal_press', array['dumbbell','bench'], 'beginner',
   'medium', 4, array[]::text[], false, jsonb_build_object('setup', jsonb_build_array('Bench at 30° — no steeper', 'Retract and depress the shoulder blades, feet planted, slight arch'), 'execution', jsonb_build_array('Lower under control to a deep stretch at the lower-chest/armpit line', 'Press up and slightly together; stop just short of lockout to keep tension'), 'breathing', 'Big breath at the top, brace, exhale through the press', 'common_mistakes', jsonb_build_array('Bench too steep (turns into a shoulder press)', 'Flaring elbows to 90°', 'Bouncing off the chest / half reps'), 'ruin_your_gains', jsonb_build_array('Half reps skip the stretched bottom position — that is where the upper-chest growth is')),
   '/exercise-media/incline-dumbbell-press/0.jpg', 'free-exercise-db (yuhonas)', 'Unlicense (public domain)'),

  ('barbell-row', 'Barbell Row', 'back', 'horizontal_pull', array['barbell'], 'intermediate',
   'high', 3, array['lower_back'], false, jsonb_build_object('setup', jsonb_build_array('Hinge to ~45°, neutral spine, bar over mid-foot', 'Brace hard — the lower back holds an isometric the whole set'), 'execution', jsonb_build_array('Drive the elbows back and pull the bar to the lower ribs', 'Lower under control without rounding or bouncing'), 'breathing', 'Brace and hold; exhale at the top of the pull', 'common_mistakes', jsonb_build_array('Rounding the lower back', 'Using momentum to swing the weight up', 'Standing too upright', 'Pulling to the wrong position (too low or high)'), 'ruin_your_gains', jsonb_build_array('Heaving with the lower back instead of the lats trades back growth for a tweaked spine')),
   '/exercise-media/barbell-row/0.jpg', 'free-exercise-db (yuhonas)', 'Unlicense (public domain)'),

  ('dumbbell-row', 'Dumbbell Row', 'back', 'horizontal_pull', array['dumbbell','bench'], 'beginner',
   'medium', 4, array[]::text[], false, jsonb_build_object('setup', jsonb_build_array('One hand and knee braced on the bench, flat back', 'Dumbbell hanging at a full stretch'), 'execution', jsonb_build_array('Drive the elbow up and back, pulling the dumbbell to the hip', 'Lower to a full stretch each rep'), 'breathing', 'Exhale on the pull, inhale on the stretch', 'common_mistakes', jsonb_build_array('Rotating the torso to heave the weight', 'Pulling to the armpit instead of hip', 'Shrugging the shoulder up', 'Using too much bicep, not enough back'), 'ruin_your_gains', jsonb_build_array('Twisting the torso to move heavier dumbbells turns off the lat you are trying to build')),
   '/exercise-media/dumbbell-row/0.jpg', 'free-exercise-db (yuhonas)', 'Unlicense (public domain)'),

  ('cable-row', 'Seated Cable Row', 'back', 'horizontal_pull', array['cable','machine'], 'beginner',
   'low', 5, array[]::text[], false, jsonb_build_object('setup', jsonb_build_array('Chest tall, slight knee bend, feet planted', 'Neutral spine — do not let the low back round at the stretch'), 'execution', jsonb_build_array('Pull to the lower stomach, driving the elbows back and squeezing the blades', 'Return to a full stretch without collapsing the chest'), 'breathing', 'Exhale on the pull, inhale on the return', 'common_mistakes', jsonb_build_array('Excessive forward/backward rocking', 'Rounding the upper back', 'Shrugging shoulders up during the pull', 'Using momentum instead of muscle'), 'ruin_your_gains', jsonb_build_array('Swinging the whole torso for momentum makes the weight look impressive and the back work disappear')),
   '/exercise-media/cable-row/0.jpg', 'free-exercise-db (yuhonas)', 'Unlicense (public domain)'),

  ('t-bar-row', 'T-Bar Row', 'back', 'horizontal_pull', array['barbell','machine'], 'intermediate',
   'high', 3, array['lower_back'], false, jsonb_build_object('setup', jsonb_build_array('Hinge with a flat, braced back, chest over the bar', 'Neutral or wide grip on the handle'), 'execution', jsonb_build_array('Pull the handle to the chest/upper stomach, elbows back', 'Lower under control, keeping the torso angle fixed'), 'breathing', 'Brace and hold; exhale at the top', 'common_mistakes', jsonb_build_array('Rounding the back', 'Standing too upright', 'Jerking the weight up', 'Cutting range of motion short'), 'ruin_your_gains', jsonb_build_array('Ratcheting the torso up on every rep loads the spine instead of the back')),
   '/exercise-media/t-bar-row/0.jpg', 'free-exercise-db (yuhonas)', 'Unlicense (public domain)'),

  ('lat-pulldown', 'Lat Pulldown', 'lats', 'vertical_pull', array['cable','machine'], 'beginner',
   'low', 5, array[]::text[], false, jsonb_build_object('setup', jsonb_build_array('Grip slightly wider than the shoulders, thumb-side loose', 'Chest up, slight lean back'), 'execution', jsonb_build_array('Depress the shoulder blades FIRST, then drive the elbows down and back', 'Full stretch at the top each rep'), 'breathing', 'Exhale on the pull, inhale on the stretch', 'common_mistakes', jsonb_build_array('Yanking with the biceps', 'Leaning back so far it becomes a row', 'Half range at the top'), 'ruin_your_gains', jsonb_build_array('Pulling with the arms instead of the back means the lats never get the work')),
   '/exercise-media/lat-pulldown/0.jpg', 'free-exercise-db (yuhonas)', 'Unlicense (public domain)'),

  ('pull-ups', 'Pull-ups / Assisted Pull-ups', 'lats', 'vertical_pull', array['pull_up_bar'], 'advanced',
   'high', 4, array[]::text[], false, jsonb_build_object('setup', jsonb_build_array('Grip slightly wider than the shoulders', 'Start from a full dead hang, shoulder blades set'), 'execution', jsonb_build_array('Pull the elbows down and back until the chin clears the bar', 'Lower all the way to a full hang under control'), 'breathing', 'Exhale on the way up, inhale on the descent', 'common_mistakes', jsonb_build_array('Kipping or swinging', 'Not achieving full range of motion', 'Shrugging shoulders to ears', 'Crossing legs and losing core tension'), 'ruin_your_gains', jsonb_build_array('Chin-over-bar half reps with a swing build ego, not lats — own the full dead hang')),
   '/exercise-media/pull-ups/0.jpg', 'free-exercise-db (yuhonas)', 'Unlicense (public domain)'),

  ('neutral_grip_db_ohp', 'Neutral-Grip DB Shoulder Press', 'front_delt', 'vertical_press', array['dumbbell'], 'intermediate',
   'high', 3, array['shoulder'], false, jsonb_build_object('setup', jsonb_build_array('Neutral (palms-facing) grip — easiest on the shoulder and neck', 'Seated with back support; ribs down, do NOT overarch'), 'execution', jsonb_build_array('Press to just short of lockout, elbows tracking slightly forward', 'Lower to ear height under control'), 'breathing', 'Brace before each rep, exhale at the top', 'common_mistakes', jsonb_build_array('Excessive lower-back/neck extension to grind a rep', 'Pressing on a day the shoulder is not pain-free'), 'ruin_your_gains', jsonb_build_array('Cranking the neck and arch to force a rep is how a cervical-sensitive lifter flares the pain — stop the set instead')),
   '/exercise-media/neutral_grip_db_ohp/0.jpg', 'free-exercise-db (yuhonas)', 'Unlicense (public domain)'),

  ('machine-shoulder-press', 'Machine Shoulder Press', 'front_delt', 'vertical_press', array['machine'], 'beginner',
   'low', 4, array[]::text[], false, jsonb_build_object('setup', jsonb_build_array('Seat set so the handles start at shoulder height', 'Back flat against the pad, ribs down'), 'execution', jsonb_build_array('Press up to just short of lockout', 'Lower under control to shoulder height'), 'breathing', 'Exhale on the press, inhale on the way down', 'common_mistakes', jsonb_build_array('Seat too low (overloads shoulders at bad angle)', 'Locking elbows aggressively', 'Lifting butt off the seat', 'Using too much weight with partial reps'), 'ruin_your_gains', jsonb_build_array('A back-supported machine is the shoulder-friendly press — don''t waste that by arching off the pad')),
   '/exercise-media/machine-shoulder-press/0.jpg', 'free-exercise-db (yuhonas)', 'Unlicense (public domain)'),

  ('overhead-press-dumbbell', 'Overhead Press (Dumbbell)', 'front_delt', 'vertical_press', array['dumbbell'], 'intermediate',
   'high', 3, array['shoulder'], false, jsonb_build_object('setup', jsonb_build_array('Seated or standing, dumbbells at shoulder height', 'Ribs down, core braced, glutes tight'), 'execution', jsonb_build_array('Press overhead to just short of lockout', 'Lower to ear height under control'), 'breathing', 'Brace, exhale at the top', 'common_mistakes', jsonb_build_array('Arching the back too much', 'Pressing forward instead of up', 'Not going through full range of motion', 'Using leg drive unintentionally'), 'ruin_your_gains', jsonb_build_array('Leaning back turns an overhead press into an ugly incline press and loads the lumbar spine')),
   '/exercise-media/overhead-press-dumbbell/0.jpg', 'free-exercise-db (yuhonas)', 'Unlicense (public domain)'),

  ('barbell-overhead-press', 'Barbell Overhead Press', 'front_delt', 'vertical_press', array['barbell'], 'intermediate',
   'high', 2, array['cervical','shoulder'], false, jsonb_build_object('setup', jsonb_build_array('Bar at collarbone height, grip just outside the shoulders', 'Full-body brace, glutes squeezed to block a lower-back arch'), 'execution', jsonb_build_array('Press the bar in a straight line overhead, moving the head back then through', 'Lower under control to the collarbone'), 'breathing', 'Big brace before each rep, exhale near the top', 'common_mistakes', jsonb_build_array('Excessive lower-back arch to grind a rep', 'Pressing the bar forward instead of overhead', 'Flaring the elbows too wide'), 'ruin_your_gains', jsonb_build_array('For a neck/shoulder-sensitive lifter the barbell path forces compensations — a neutral-grip DB or machine press is the smarter pick')),
   '/exercise-media/barbell-overhead-press/0.jpg', 'free-exercise-db (yuhonas)', 'Unlicense (public domain)'),

  ('lateral-raises', 'Lateral Raises', 'side_delt', 'lateral_raise', array['dumbbell'], 'beginner',
   'medium', 4, array[]::text[], false, jsonb_build_object('setup', jsonb_build_array('Slight forward lean, soft bend in the elbows', 'Dumbbells just off the thighs'), 'execution', jsonb_build_array('Lead with the elbows, raise to ~shoulder height', 'Lower slowly — the negative is the point'), 'breathing', 'Exhale up, inhale down', 'common_mistakes', jsonb_build_array('Using too much weight and swinging', 'Shrugging the traps to lift', 'Raising above shoulder level', 'Thumbs pointing up (reduces delt activation)'), 'ruin_your_gains', jsonb_build_array('Shrugging hands the work to the traps — keep the traps down and let the side delt lift')),
   '/exercise-media/lateral-raises/0.jpg', 'free-exercise-db (yuhonas)', 'Unlicense (public domain)'),

  ('cable-lateral-raises', 'Cable Lateral Raise', 'side_delt', 'lateral_raise', array['cable'], 'beginner',
   'low', 5, array[]::text[], false, jsonb_build_object('setup', jsonb_build_array('Stand side-on to a low pulley; cable runs across the front of the body', 'Slight forward lean, working arm starts across the midline'), 'execution', jsonb_build_array('Lead with the elbow, raise to ~shoulder height', 'Control the negative all the way back across the body'), 'breathing', 'Exhale up, inhale down', 'common_mistakes', jsonb_build_array('Going too heavy and swinging', 'Raising above ~90° on cranky shoulders'), 'ruin_your_gains', jsonb_build_array('Shrugging — if the upper trap takes over, the side delt stops working. Keep the trap down.')),
   '/exercise-media/cable-lateral-raises/0.jpg', 'free-exercise-db (yuhonas)', 'Unlicense (public domain)'),

  ('reverse-flyes', 'Reverse Flyes (Rear Delt)', 'rear_delt', 'horizontal_pull', array['dumbbell'], 'beginner',
   'medium', 4, array[]::text[], false, jsonb_build_object('setup', jsonb_build_array('Hinge forward with a flat back, or lie chest-down on an incline', 'Soft elbows, light dumbbells'), 'execution', jsonb_build_array('Raise the dumbbells out to the sides, leading with the elbows', 'Squeeze the rear delts, lower under control'), 'breathing', 'Exhale as you raise, inhale as you lower', 'common_mistakes', jsonb_build_array('Using momentum to swing the weights', 'Standing too upright', 'Excessive elbow bending', 'Shrugging the traps'), 'ruin_your_gains', jsonb_build_array('Rowing the weight up with the mid-back robs the rear delt of the small, deliberate work it needs')),
   '/exercise-media/reverse-flyes/0.jpg', 'free-exercise-db (yuhonas)', 'Unlicense (public domain)'),

  ('face-pulls', 'Cable Face Pull', 'rear_delt', 'horizontal_pull', array['cable'], 'beginner',
   'low', 4, array[]::text[], false, jsonb_build_object('setup', jsonb_build_array('Rope at ~eye height, step back for tension, light weight', 'Tall posture, elbows high'), 'execution', jsonb_build_array('Pull the rope toward the eyes, hands finishing beside/behind the ears', 'Add a small external rotation at the end for the cuff/shoulder-health payoff'), 'breathing', 'Exhale on the pull', 'common_mistakes', jsonb_build_array('Dropping the elbows (turns into a row)', 'Rushing the reps', 'Going too heavy'), 'ruin_your_gains', jsonb_build_array('Too heavy kills the rear-delt and cuff benefit — this is a control exercise, not an ego one')),
   '/exercise-media/face-pulls/0.jpg', 'free-exercise-db (yuhonas)', 'Unlicense (public domain)'),

  ('barbell-squat', 'Barbell Squat', 'quads', 'squat', array['barbell'], 'intermediate',
   'high', 3, array[]::text[], false, jsonb_build_object('setup', jsonb_build_array('Bar on the upper back, feet ~shoulder width, toes slightly out', 'Brace the core, chest up'), 'execution', jsonb_build_array('Sit down and back to at least parallel, knees tracking over the toes', 'Drive up through the whole foot'), 'breathing', 'Big breath and brace at the top, exhale on the way up', 'common_mistakes', jsonb_build_array('Knees caving inward', 'Leaning too far forward (good morning squat)', 'Not hitting depth', 'Rounding the lower back at the bottom'), 'ruin_your_gains', jsonb_build_array('Chasing depth by rounding the lower back trades quads for a spinal risk — own the range you can brace')),
   '/exercise-media/barbell-squat/0.jpg', 'free-exercise-db (yuhonas)', 'Unlicense (public domain)'),

  ('leg-press', 'Leg Press', 'quads', 'squat', array['machine'], 'beginner',
   'low', 5, array[]::text[], false, jsonb_build_object('setup', jsonb_build_array('Feet mid-platform ~shoulder width, whole foot down', 'Lower back and hips flat against the pad'), 'execution', jsonb_build_array('Lower until the knees reach ~90° or a touch deeper, back still flat', 'Press up without locking the knees hard'), 'breathing', 'Inhale on the way down, exhale on the press', 'common_mistakes', jsonb_build_array('Going too deep and rounding lower back', 'Locking out knees', 'Placing feet too high or low on the platform', 'Using too much weight with half reps'), 'ruin_your_gains', jsonb_build_array('Going so deep the hips tuck rounds the lumbar under load — stop where the back stays flat')),
   '/exercise-media/leg-press/0.jpg', 'free-exercise-db (yuhonas)', 'Unlicense (public domain)'),

  ('hack-squat', 'Hack Squat', 'quads', 'squat', array['machine'], 'intermediate',
   'low', 5, array[]::text[], false, jsonb_build_object('setup', jsonb_build_array('Back and shoulders against the pad, feet mid-platform', 'Brace against the pad'), 'execution', jsonb_build_array('Descend under control to at least parallel', 'Drive up through the whole foot, knees tracking the toes'), 'breathing', 'Inhale down, exhale up', 'common_mistakes', jsonb_build_array('Cutting depth short', 'Placing feet too far forward or back', 'Locking knees at extension', 'Letting knees cave inward'), 'ruin_your_gains', jsonb_build_array('Bouncing out of the bottom to move more plates skips the hard, growth-driving range')),
   '/exercise-media/hack-squat/0.jpg', 'free-exercise-db (yuhonas)', 'Unlicense (public domain)'),

  ('goblet-squat', 'Goblet Squat', 'quads', 'squat', array['dumbbell','kettlebell'], 'beginner',
   'medium', 4, array[]::text[], false, jsonb_build_object('setup', jsonb_build_array('Hold a dumbbell/kettlebell at the chest, elbows tucked', 'Feet ~shoulder width, chest tall'), 'execution', jsonb_build_array('Sit straight down between the hips to depth, elbows inside the knees', 'Drive up through the whole foot'), 'breathing', 'Inhale down, exhale up', 'common_mistakes', jsonb_build_array('Leaning forward', 'Letting the weight drift away from the body', 'Not going deep enough', 'Knees caving inward'), 'ruin_your_gains', jsonb_build_array('Letting the chest cave forward turns a clean quad squat into a round-back good morning')),
   '/exercise-media/goblet-squat/0.jpg', 'free-exercise-db (yuhonas)', 'Unlicense (public domain)'),

  ('bulgarian-split-squat', 'Bulgarian Split Squat', 'quads', 'squat', array['dumbbell'], 'intermediate',
   'high', 3, array[]::text[], false, jsonb_build_object('setup', jsonb_build_array('Rear foot on a bench, front foot ~2 feet ahead', 'Torso tall, core braced'), 'execution', jsonb_build_array('Lower straight down until the front thigh is ~parallel', 'Drive up through the front heel, keeping balance'), 'breathing', 'Inhale down, exhale up', 'common_mistakes', jsonb_build_array('Front foot too close to the bench', 'Leaning too far forward', 'Rear foot doing too much work', 'Knee collapsing inward'), 'ruin_your_gains', jsonb_build_array('Rushing for balance turns a great unilateral quad builder into a wobble — slow down and own each rep')),
   '/exercise-media/bulgarian-split-squat/0.jpg', 'free-exercise-db (yuhonas)', 'Unlicense (public domain)'),

  ('leg-extension', 'Leg Extension', 'quads', 'isolation', array['machine'], 'beginner',
   'low', 4, array['knee'], false, jsonb_build_object('setup', jsonb_build_array('Pad just above the ankles, back flat against the seat', 'Knees aligned with the machine pivot'), 'execution', jsonb_build_array('Extend to full lockout and squeeze the quads hard', 'Lower under control over 2-3 seconds'), 'breathing', 'Exhale as you extend, inhale as you lower', 'common_mistakes', jsonb_build_array('Using momentum to swing the weight', 'Not achieving full extension', 'Going too heavy with partial reps', 'Lifting hips off the seat'), 'ruin_your_gains', jsonb_build_array('Swinging the pad up with momentum skips the squeeze and just grinds the knee — control it')),
   '/exercise-media/leg-extension/0.jpg', 'free-exercise-db (yuhonas)', 'Unlicense (public domain)'),

  ('romanian-deadlift', 'Romanian Deadlift', 'hamstrings', 'hinge', array['barbell','dumbbell'], 'intermediate',
   'high', 3, array['lower_back'], false, jsonb_build_object('setup', jsonb_build_array('Soft knees, bar/dumbbells against the thighs', 'Brace, shoulders back, neutral spine'), 'execution', jsonb_build_array('Push the hips back, sliding the weight down the thighs to a hamstring stretch', 'Drive the hips forward to stand tall — do not hyperextend'), 'breathing', 'Big breath at the top, brace, exhale at lockout', 'common_mistakes', jsonb_build_array('Rounding the lower back', 'Bending the knees too much', 'Bar drifting away from the body', 'Not hinging enough at the hips'), 'ruin_your_gains', jsonb_build_array('Rounding the back to chase a deeper stretch swaps hamstring tension for lumbar load — keep it neutral')),
   '/exercise-media/romanian-deadlift/0.jpg', 'free-exercise-db (yuhonas)', 'Unlicense (public domain)'),

  ('good-mornings', 'Good Mornings', 'hamstrings', 'hinge', array['barbell'], 'intermediate',
   'high', 2, array['lower_back'], false, jsonb_build_object('setup', jsonb_build_array('Light bar on the upper back, soft knees', 'Brace hard, neutral spine'), 'execution', jsonb_build_array('Hinge at the hips, pushing them back to a hamstring stretch', 'Stand up by driving the hips forward'), 'breathing', 'Brace at the top, exhale as you stand', 'common_mistakes', jsonb_build_array('Rounding the back', 'Bending the knees too much', 'Going too heavy too soon', 'Not achieving full hip hinge'), 'ruin_your_gains', jsonb_build_array('The long lever over the spine punishes any rounding — go light and keep the back flat or skip it')),
   '/exercise-media/good-mornings/0.jpg', 'free-exercise-db (yuhonas)', 'Unlicense (public domain)'),

  ('leg-curl', 'Leg Curl (Machine)', 'hamstrings', 'isolation', array['machine'], 'beginner',
   'low', 5, array[]::text[], false, jsonb_build_object('setup', jsonb_build_array('Pad just above the heels, knees at the pivot', 'Hips down on the pad'), 'execution', jsonb_build_array('Curl the heels toward the glutes, squeeze the hamstrings', 'Lower under control to a full stretch'), 'breathing', 'Exhale on the curl, inhale on the return', 'common_mistakes', jsonb_build_array('Lifting hips off the pad', 'Using momentum to swing the weight', 'Not achieving full contraction', 'Going too heavy with partial reps'), 'ruin_your_gains', jsonb_build_array('Bucking the hips off the pad to move the stack takes the hamstring right out of the movement')),
   '/exercise-media/leg-curl/0.jpg', 'free-exercise-db (yuhonas)', 'Unlicense (public domain)'),

  ('hip-thrust', 'Barbell Hip Thrust', 'glutes', 'hip_hinge', array['barbell','bench'], 'beginner',
   'medium', 5, array[]::text[], false, jsonb_build_object('setup', jsonb_build_array('Upper back on the bench, bar over the hips (use a pad)', 'Feet flat, shins vertical at the top'), 'execution', jsonb_build_array('Chin tucked, ribs down; drive through the heels to full hip extension', 'Squeeze into a posterior pelvic tilt at the top, lower under control'), 'breathing', 'Exhale as you drive up', 'common_mistakes', jsonb_build_array('Hyperextending the lower back at the top instead of tilting the pelvis', 'Half-range reps / not locking the hips out'), 'ruin_your_gains', jsonb_build_array('Arching the lumbar to fake extra height puts it in your back, not your glutes — the opposite of the goal')),
   '/exercise-media/hip-thrust/0.jpg', 'free-exercise-db (yuhonas)', 'Unlicense (public domain)'),

  ('glute-bridge', 'Glute Bridge', 'glutes', 'hip_hinge', array['bodyweight','dumbbell'], 'beginner',
   'low', 4, array[]::text[], false, jsonb_build_object('setup', jsonb_build_array('On the floor, feet flat and close to the glutes', 'Ribs down, chin tucked'), 'execution', jsonb_build_array('Drive through the heels to full hip extension', 'Squeeze the glutes at the top, lower under control'), 'breathing', 'Exhale as you bridge up', 'common_mistakes', jsonb_build_array('Pushing through lower back instead of glutes', 'Not squeezing at the top', 'Feet too close or too far from hips', 'Rushing through reps'), 'ruin_your_gains', jsonb_build_array('If you feel it in your lower back, you are arching instead of squeezing the glutes — tuck the ribs')),
   '/exercise-media/glute-bridge/0.jpg', 'free-exercise-db (yuhonas)', 'Unlicense (public domain)'),

  ('cable-pull-through', 'Cable Pull-through', 'glutes', 'hip_hinge', array['cable'], 'beginner',
   'medium', 4, array[]::text[], false, jsonb_build_object('setup', jsonb_build_array('Face away from a low pulley, rope between the legs', 'Soft knees, hips back, neutral spine'), 'execution', jsonb_build_array('Hinge back to a stretch, then drive the hips forward to stand tall', 'Squeeze the glutes at lockout — do not lean back'), 'breathing', 'Inhale on the hinge, exhale at lockout', 'common_mistakes', jsonb_build_array('Squatting instead of hinging', 'Pulling with the arms', 'Not driving hips through fully', 'Rounding the lower back'), 'ruin_your_gains', jsonb_build_array('Yanking with the arms or leaning back at the top steals the movement from the glutes')),
   '/exercise-media/cable-pull-through/0.jpg', 'free-exercise-db (yuhonas)', 'Unlicense (public domain)'),

  ('banded-glute-bridge', 'Banded Glute Bridge', 'glutes', 'hip_hinge', array['band'], 'beginner',
   'low', 3, array[]::text[], false, jsonb_build_object('setup', jsonb_build_array('Band just above the knees, feet flat and close to the glutes', 'Ribs down, chin tucked'), 'execution', jsonb_build_array('Press the knees out against the band as you bridge to full hip extension', 'Squeeze the glutes at the top, lower under control'), 'breathing', 'Exhale as you bridge up', 'common_mistakes', jsonb_build_array('Letting knees cave in', 'Pushing through toes', 'Not squeezing at the top', 'Arching lower back instead of driving hips'), 'ruin_your_gains', jsonb_build_array('Letting the knees collapse inward switches off the glute-medius work the band is there to drive')),
   '/exercise-media/banded-glute-bridge/0.jpg', 'free-exercise-db (yuhonas)', 'Unlicense (public domain)'),

  ('barbell-curl', 'Barbell Curl', 'biceps', 'isolation', array['barbell'], 'beginner',
   'medium', 3, array[]::text[], false, jsonb_build_object('setup', jsonb_build_array('Shoulder-width grip, elbows pinned at the sides', 'Tall posture, core braced'), 'execution', jsonb_build_array('Curl the bar up by flexing the elbows, keeping them still', 'Lower under control to a full stretch'), 'breathing', 'Exhale on the curl, inhale on the way down', 'common_mistakes', jsonb_build_array('Swinging the body to cheat', 'Elbows drifting forward', 'Not using full range of motion', 'Going too heavy with poor form'), 'ruin_your_gains', jsonb_build_array('Heaving with the low back turns a bicep curl into a bad row — pin the elbows and let the arms work')),
   '/exercise-media/barbell-curl/0.jpg', 'free-exercise-db (yuhonas)', 'Unlicense (public domain)'),

  ('dumbbell-curl', 'Dumbbell Curl', 'biceps', 'isolation', array['dumbbell'], 'beginner',
   'low', 4, array[]::text[], false, jsonb_build_object('setup', jsonb_build_array('Dumbbells at the sides, palms forward as you curl', 'Elbows pinned, tall posture'), 'execution', jsonb_build_array('Curl up with control, supinating the wrist', 'Lower all the way to a full stretch'), 'breathing', 'Exhale on the curl, inhale down', 'common_mistakes', jsonb_build_array('Swinging the weight', 'Elbows moving forward and back', 'Half reps — not extending fully', 'Leaning back to lift heavier'), 'ruin_your_gains', jsonb_build_array('Cutting the bottom of the curl short skips the stretched position where the bicep grows')),
   '/exercise-media/dumbbell-curl/0.jpg', 'free-exercise-db (yuhonas)', 'Unlicense (public domain)'),

  ('hammer-curl', 'Hammer Curl', 'biceps', 'isolation', array['dumbbell'], 'beginner',
   'low', 4, array[]::text[], false, jsonb_build_object('setup', jsonb_build_array('Neutral (palms-facing) grip, elbows at the sides', 'Tall posture, braced'), 'execution', jsonb_build_array('Curl up keeping the palms facing in the whole way', 'Lower under control to a full stretch'), 'breathing', 'Exhale on the curl, inhale down', 'common_mistakes', jsonb_build_array('Turning it into a regular curl by rotating wrists', 'Swinging the body', 'Elbows drifting forward', 'Partial range of motion'), 'ruin_your_gains', jsonb_build_array('Swinging robs the brachialis and forearm of the tension the neutral grip is meant to build')),
   '/exercise-media/hammer-curl/0.jpg', 'free-exercise-db (yuhonas)', 'Unlicense (public domain)'),

  ('tricep-pushdown', 'Triceps Pushdown (Cable)', 'triceps', 'isolation', array['cable'], 'beginner',
   'low', 5, array[]::text[], false, jsonb_build_object('setup', jsonb_build_array('Rope or bar at the top pulley, elbows pinned at the sides', 'Slight forward lean, braced'), 'execution', jsonb_build_array('Extend the elbows fully, spreading the rope at the bottom', 'Return under control without letting the elbows drift'), 'breathing', 'Exhale on the pushdown, inhale on the return', 'common_mistakes', jsonb_build_array('Elbows flaring or moving forward', 'Using shoulders to press down', 'Not achieving full extension', 'Letting the weight stack slam'), 'ruin_your_gains', jsonb_build_array('Letting the elbows travel turns it into a press and steals the work from the triceps')),
   '/exercise-media/tricep-pushdown/0.jpg', 'free-exercise-db (yuhonas)', 'Unlicense (public domain)'),

  ('overhead-tricep-extension', 'Overhead Triceps Extension', 'triceps', 'isolation', array['dumbbell','cable'], 'beginner',
   'medium', 4, array[]::text[], false, jsonb_build_object('setup', jsonb_build_array('Weight overhead, elbows pointing forward and close to the head', 'Ribs down, core braced'), 'execution', jsonb_build_array('Lower behind the head to a deep triceps stretch', 'Extend to lockout, keeping the elbows in'), 'breathing', 'Inhale on the stretch, exhale on the extension', 'common_mistakes', jsonb_build_array('Elbows flaring outward', 'Arching the lower back', 'Not going through full range of motion', 'Using too much weight'), 'ruin_your_gains', jsonb_build_array('Flaring the elbows out skips the stretched position that makes the overhead variation worth doing')),
   '/exercise-media/overhead-tricep-extension/0.jpg', 'free-exercise-db (yuhonas)', 'Unlicense (public domain)'),

  ('skull-crushers', 'Skull Crushers', 'triceps', 'isolation', array['barbell','dumbbell'], 'intermediate',
   'medium', 3, array[]::text[], false, jsonb_build_object('setup', jsonb_build_array('Lie back, weight over the chest, elbows pointing up', 'Upper arms fixed'), 'execution', jsonb_build_array('Lower to the forehead/behind the head by bending only the elbows', 'Extend back to just short of lockout'), 'breathing', 'Inhale on the way down, exhale on the extension', 'common_mistakes', jsonb_build_array('Elbows flaring outward', 'Dropping the weight too fast', 'Upper arms swaying back and forth', 'Using too much weight'), 'ruin_your_gains', jsonb_build_array('Drifting the upper arms to press the weight up takes tension off the triceps and onto the shoulders')),
   '/exercise-media/skull-crushers/0.jpg', 'free-exercise-db (yuhonas)', 'Unlicense (public domain)'),

  ('dead-bug', 'Dead Bug', 'core', 'isolation', array['bodyweight'], 'beginner',
   'low', 4, array[]::text[], false, jsonb_build_object('setup', jsonb_build_array('On the back, arms up, knees over the hips at 90°', 'Press the lower back flat into the floor'), 'execution', jsonb_build_array('Lower the opposite arm and leg slowly, keeping the back flat', 'Return and switch sides under control'), 'breathing', 'Exhale as the limbs extend, keeping the ribs down', 'common_mistakes', jsonb_build_array('Lower back arching off the floor', 'Moving too quickly', 'Not coordinating opposite arm/leg', 'Holding breath'), 'ruin_your_gains', jsonb_build_array('The instant the lower back lifts off the floor the abs stop working — that flat back is the whole exercise')),
   '/exercise-media/dead-bug/0.jpg', 'free-exercise-db (yuhonas)', 'Unlicense (public domain)'),

  ('plank', 'Plank', 'core', 'isolation', array['bodyweight'], 'beginner',
   'low', 3, array[]::text[], false, jsonb_build_object('setup', jsonb_build_array('Forearms under the shoulders, body in a straight line', 'Squeeze glutes and quads'), 'execution', jsonb_build_array('Hold the straight line, ribs down, without sagging or piking', 'Brace as if about to be tapped in the stomach'), 'breathing', 'Breathe normally throughout — do not hold the breath', 'common_mistakes', jsonb_build_array('Hips sagging toward the floor', 'Hips piking up too high', 'Looking forward (strains neck)', 'Holding breath'), 'ruin_your_gains', jsonb_build_array('A sagging hip loads the lower back instead of bracing the abs — cut the hold when the line breaks')),
   '/exercise-media/plank/0.jpg', 'free-exercise-db (yuhonas)', 'Unlicense (public domain)'),

  ('side-plank', 'Side Plank', 'core', 'isolation', array['bodyweight'], 'beginner',
   'low', 3, array[]::text[], false, jsonb_build_object('setup', jsonb_build_array('Forearm under the shoulder, body stacked in a straight line', 'Hips lifted, feet stacked or staggered'), 'execution', jsonb_build_array('Hold the line, driving the hips up and forward slightly', 'Keep the top shoulder back, do not roll forward'), 'breathing', 'Breathe steadily throughout', 'common_mistakes', jsonb_build_array('Hips dropping', 'Rotating forward or backward', 'Elbow too far from shoulder', 'Holding breath'), 'ruin_your_gains', jsonb_build_array('Letting the hip drop turns a strong anti-lateral-flexion hold into a passive lean on the shoulder')),
   '/exercise-media/side-plank/0.jpg', 'free-exercise-db (yuhonas)', 'Unlicense (public domain)'),

  ('cable-woodchop', 'Cable Woodchop', 'core', 'isolation', array['cable'], 'intermediate',
   'medium', 4, array[]::text[], false, jsonb_build_object('setup', jsonb_build_array('Cable set high (or low), stand side-on, arms extended', 'Feet planted, core braced'), 'execution', jsonb_build_array('Rotate through the trunk, pulling the handle across the body', 'Return under control, resisting the rotation'), 'breathing', 'Exhale on the chop, inhale on the return', 'common_mistakes', jsonb_build_array('Using only the arms', 'Not controlling the eccentric', 'Rounding the back', 'Standing too close to the cable'), 'ruin_your_gains', jsonb_build_array('Yanking with the arms turns a rotational core drill into a lat pull — the rotation has to come from the trunk')),
   '/exercise-media/cable-woodchop/0.jpg', 'free-exercise-db (yuhonas)', 'Unlicense (public domain)'),

  ('hanging-leg-raise', 'Hanging Leg Raise', 'core', 'isolation', array['pull_up_bar'], 'advanced',
   'high', 4, array[]::text[], false, jsonb_build_object('setup', jsonb_build_array('Dead hang from the bar, shoulders active', 'Pelvis set, no swing'), 'execution', jsonb_build_array('Curl the pelvis up and raise the legs, rolling the hips under', 'Lower slowly without swinging'), 'breathing', 'Exhale as you raise, inhale as you lower', 'common_mistakes', jsonb_build_array('Swinging to generate momentum', 'Only lifting legs without pelvic tilt', 'Dropping legs on the way down', 'Bending knees excessively'), 'ruin_your_gains', jsonb_build_array('Kipping the legs up with a swing works the hip flexors, not the abs — the pelvic curl is the rep')),
   '/exercise-media/hanging-leg-raise/0.jpg', 'free-exercise-db (yuhonas)', 'Unlicense (public domain)'),

  ('ab-wheel-rollout', 'Ab Wheel Rollout', 'core', 'isolation', array['ab_wheel'], 'intermediate',
   'high', 4, array['lower_back'], false, jsonb_build_object('setup', jsonb_build_array('Kneel with the wheel under the shoulders', 'Brace hard, ribs down, posterior pelvic tilt'), 'execution', jsonb_build_array('Roll out only as far as you can hold the brace with a flat back', 'Pull back by bracing the abs, not the hip flexors'), 'breathing', 'Inhale on the roll-out, exhale as you pull back', 'common_mistakes', jsonb_build_array('Letting the lower back collapse', 'Going too far before building strength', 'Leading with the hips on the return', 'Not engaging the core throughout'), 'ruin_your_gains', jsonb_build_array('Rolling past your braceable range dumps the load into the lower back — shorten the range, keep the brace')),
   '/exercise-media/ab-wheel-rollout/0.jpg', 'free-exercise-db (yuhonas)', 'Unlicense (public domain)'),

  ('bird-dog', 'Bird Dog', 'core', 'isolation', array['bodyweight'], 'beginner',
   'low', 3, array[]::text[], false, jsonb_build_object('setup', jsonb_build_array('On all fours, hands under shoulders, knees under hips', 'Neutral spine, ribs down'), 'execution', jsonb_build_array('Extend the opposite arm and leg to a straight line, no rotation', 'Return under control and switch sides'), 'breathing', 'Exhale as the limbs extend', 'common_mistakes', jsonb_build_array('Rotating hips to one side', 'Arching the lower back', 'Rushing through reps', 'Not extending fully'), 'ruin_your_gains', jsonb_build_array('Letting the hips twist open turns an anti-rotation drill into a mobility flail — keep the pelvis square')),
   null, null, null),

  ('standing-calf-raise', 'Standing Calf Raise', 'calves', 'isolation', array['machine','barbell','dumbbell'], 'beginner',
   'medium', 4, array[]::text[], false, jsonb_build_object('setup', jsonb_build_array('Balls of the feet on the edge of a platform', 'Knees straight but not locked'), 'execution', jsonb_build_array('Lower the heels for a full stretch below the platform', 'Rise onto the toes as high as possible, pause and squeeze'), 'breathing', 'Exhale as you rise, inhale on the stretch', 'common_mistakes', jsonb_build_array('Bouncing out of the bottom stretch', 'Partial range of motion', 'Using momentum instead of the calf'), 'ruin_your_gains', jsonb_build_array('Bouncing on the tendon instead of a controlled stretch-and-squeeze skips the growth stimulus entirely')),
   '/exercise-media/standing-calf-raise/0.jpg', 'free-exercise-db (yuhonas)', 'Unlicense (public domain)'),

  ('seated-calf-raise', 'Seated Calf Raise', 'calves', 'isolation', array['machine'], 'beginner',
   'low', 5, array[]::text[], false, jsonb_build_object('setup', jsonb_build_array('Pads across the lower thighs, balls of the feet on the platform', 'Knees bent ~90° (targets the soleus)'), 'execution', jsonb_build_array('Lower the heels for a full stretch', 'Press up onto the toes, pause and squeeze'), 'breathing', 'Exhale as you press up, inhale on the stretch', 'common_mistakes', jsonb_build_array('Bouncing out of the bottom stretch', 'Partial range of motion', 'Going too heavy with half reps'), 'ruin_your_gains', jsonb_build_array('Half reps with a heavy stack feel productive but skip the stretched position the soleus responds to')),
   '/exercise-media/seated-calf-raise/0.jpg', 'free-exercise-db (yuhonas)', 'Unlicense (public domain)'),

  ('behind-neck-press', 'Behind-the-Neck Press', 'front_delt', 'vertical_press', array['barbell'], 'advanced',
   'high', 1, array['cervical','shoulder'], true, jsonb_build_object('setup', jsonb_build_array('Only for lifters with verified overhead shoulder mobility', 'Light loads only'), 'execution', jsonb_build_array('Bar lowered behind the head to the base of the neck, then pressed overhead'), 'breathing', 'Brace, exhale at the top', 'common_mistakes', jsonb_build_array('Forcing the bar behind the neck without adequate mobility', 'Loading heavy too soon'), 'ruin_your_gains', jsonb_build_array('Placing the shoulder in a forced, externally-rotated position under load is why this is deprecated — use a neutral-grip or machine press')),
   '/exercise-media/behind-neck-press/0.jpg', 'free-exercise-db (yuhonas)', 'Unlicense (public domain)'),

  ('behind-neck-pulldown', 'Behind-the-Neck Lat Pulldown', 'lats', 'vertical_pull', array['cable','machine'], 'advanced',
   'high', 1, array['cervical','shoulder'], true, jsonb_build_object('setup', jsonb_build_array('Requires excellent shoulder external-rotation mobility', 'Light loads only'), 'execution', jsonb_build_array('Bar pulled down behind the head to the base of the neck rather than to the chest'), 'breathing', 'Exhale on the pull', 'common_mistakes', jsonb_build_array('Rounding the neck forward to make room for the bar', 'Loading heavy too soon'), 'ruin_your_gains', jsonb_build_array('The impinged, behind-the-neck position under load is why this is deprecated — pull to the chest instead')),
   '/exercise-media/behind-neck-pulldown/0.jpg', 'free-exercise-db (yuhonas)', 'Unlicense (public domain)'),

  ('upright-row', 'Barbell Upright Row', 'side_delt', 'lateral_raise', array['barbell'], 'intermediate',
   'high', 1, array['cervical','shoulder'], true, jsonb_build_object('setup', jsonb_build_array('Only relevant as a legacy movement — deprecated for shoulder health', 'Keep the bar close to the body'), 'execution', jsonb_build_array('Pull the bar up along the body to chest height, leading with the elbows', 'Stop at chest height, not the chin'), 'breathing', 'Exhale on the pull', 'common_mistakes', jsonb_build_array('Pulling above chest height (internal shoulder rotation under load)', 'Using a narrow grip which worsens impingement risk'), 'ruin_your_gains', jsonb_build_array('The high internal-rotation pull is a classic impingement driver — lateral raises and face pulls do the job safely')),
   '/exercise-media/upright-row/0.jpg', 'free-exercise-db (yuhonas)', 'Unlicense (public domain)'),

  ('barbell-shrug', 'Heavy Barbell Shrug', 'traps', 'isolation', array['barbell'], 'intermediate',
   'medium', 2, array['cervical'], false, jsonb_build_object('setup', jsonb_build_array('Hold a barbell at arm''s length, tall posture', 'Controlled, no rolling'), 'execution', jsonb_build_array('Elevate the shoulders straight up toward the ears', 'Lower under control — straight up-and-down path'), 'breathing', 'Exhale as you shrug up', 'common_mistakes', jsonb_build_array('Rolling the shoulders (grinds the neck under load)', 'Using momentum / bouncing the weight', 'Excessive load causing neck strain'), 'ruin_your_gains', jsonb_build_array('Rolling heavy shrugs grinds the cervical spine — for a neck-sensitive lifter, keep it light and straight or skip it')),
   '/exercise-media/barbell-shrug/0.jpg', 'free-exercise-db (yuhonas)', 'Unlicense (public domain)')

on conflict (id) do update set
  name              = excluded.name,
  primary_muscle    = excluded.primary_muscle,
  movement_pattern  = excluded.movement_pattern,
  equipment         = excluded.equipment,
  difficulty        = excluded.difficulty,
  stability_demand  = excluded.stability_demand,
  sfr_rating        = excluded.sfr_rating,
  contraindications = excluded.contraindications,
  deprecated        = excluded.deprecated,
  cues              = excluded.cues,
  gif_url           = excluded.gif_url,
  media_attribution = excluded.media_attribution,
  media_license     = excluded.media_license;
