-- 017_exercise_library_v2_sample.sql
-- Quality-bar template for the exercise-library upgrade. Six flagship movements
-- (the priority lifts for Person A's delts/chest and Person B's progressions),
-- built to the standard the FULL library should match. Extend this pattern to the
-- rest of the 50+ exercises.
--
-- MEDIA STRATEGY (hybrid): cue-card is always present (offline workhorse). gif_url
-- is populated at SEED TIME from the wger API (wger.de/api/v2/), not hardcoded here
-- (wger content is CC-BY-SA 3.0 -> attribution required; ExerciseDB gifs expire
-- daily and can't be seeded). youtube_id stays null; the ExerciseCard builds a
-- YouTube *search* link from the name as the one-tap deep-dive (never rots).

-- One small addendum to 015: license/attribution to stay CC-BY-SA compliant.
alter table exercise_library
  add column if not exists media_attribution text,   -- e.g. "wger.de / <author>"
  add column if not exists media_license     text;   -- e.g. "CC-BY-SA 3.0"

-- Widen movement_pattern to support granular categories. The original constraint
-- only allowed push/pull/hinge/squat/carry/isolation. The v2 library uses more
-- specific patterns (horizontal_press, vertical_pull, etc.) for better filtering.
alter table exercise_library drop constraint if exists exercise_library_movement_pattern_check;
alter table exercise_library add constraint exercise_library_movement_pattern_check
  check (movement_pattern in (
    'push','pull','hinge','squat','carry','isolation',
    'horizontal_press','vertical_press','horizontal_pull','vertical_pull',
    'hip_hinge','lateral_raise'
  ));

-- ID RECONCILIATION:
-- Existing seed-exercises.sql uses kebab-case. This migration uses those same IDs
-- so ON CONFLICT enriches the existing rows with v2 fields (cues, SFR, etc.)
-- rather than creating duplicates.
--   cable-lateral-raises  (was cable_lateral_raise)
--   incline-dumbbell-press (was incline_db_press_30)
--   lat-pulldown           (was lat_pulldown)
--   hip-thrust             (was barbell_hip_thrust)
--   face-pulls             (was face_pull)
--   neutral_grip_db_ohp    genuinely new — no existing match

insert into exercise_library
  (id, name, primary_muscle, movement_pattern, equipment, difficulty,
   stability_demand, sfr_rating, contraindications, cues, gif_url, youtube_id)
values

('cable-lateral-raises', 'Cable Lateral Raise', 'side_delt', 'lateral_raise',
 '{cable}', 'beginner', 'low', 5, '{}',
 jsonb_build_object(
   'setup', jsonb_build_array(
     'Stand side-on to a low pulley; cable runs across the front of your body',
     'Slight forward lean, working arm starts across the midline for a deeper stretch'),
   'execution', jsonb_build_array(
     'Lead with the elbow, raise to ~shoulder height',
     'Control the negative all the way back across the body (that stretch is the point)'),
   'breathing', 'Exhale up, inhale down',
   'common_mistakes', jsonb_build_array(
     'Going too heavy and swinging', 'Raising above ~90 degrees on cranky shoulders'),
   'ruin_your_gains', jsonb_build_array(
     'Shrugging — if the upper trap takes over, the side delt stops working. Keep the trap down.')),
 null, null),

('incline-dumbbell-press', 'Incline Dumbbell Press (30 degrees)', 'upper_chest', 'horizontal_press',
 '{dumbbell, bench}', 'beginner', 'medium', 4, '{}',
 jsonb_build_object(
   'setup', jsonb_build_array(
     'Bench at 30 degrees — no steeper',
     'Retract and depress the shoulder blades, feet planted, slight arch'),
   'execution', jsonb_build_array(
     'Lower under control to a deep stretch at the lower chest/armpit line',
     'Press up and slightly together; stop just short of lockout to keep tension'),
   'breathing', 'Big breath at the top, brace, exhale through the press',
   'common_mistakes', jsonb_build_array(
     'Bench too steep (turns into a shoulder press)', 'Flaring elbows to 90 degrees'),
   'ruin_your_gains', jsonb_build_array(
     'Bouncing off the chest / half reps — the stretched bottom position is where the growth is.')),
 null, null),

('neutral_grip_db_ohp', 'Neutral-Grip DB Shoulder Press', 'front_delt', 'vertical_press',
 '{dumbbell}', 'intermediate', 'high', 3, '{shoulder}',
 jsonb_build_object(
   'setup', jsonb_build_array(
     'Neutral (palms-facing) grip — easiest on the shoulder and neck',
     'Seated with back support; ribs down, do NOT overarch'),
   'execution', jsonb_build_array(
     'Press to just short of lockout, elbows tracking slightly forward',
     'Lower to ear height under control'),
   'breathing', 'Brace before each rep, exhale at the top',
   'common_mistakes', jsonb_build_array(
     'Excessive lower-back/neck extension to grind a rep', 'Pressing only if pain-free that day'),
   'ruin_your_gains', jsonb_build_array(
     'Cranking the neck/arch to force reps — for a cervical-sensitive lifter this is how the pain flares. Stop the set instead.')),
 null, null),

('lat-pulldown', 'Lat Pulldown', 'lats', 'vertical_pull',
 '{cable, machine}', 'beginner', 'low', 5, '{}',
 jsonb_build_object(
   'setup', jsonb_build_array(
     'Grip slightly wider than shoulders, thumb-side loose',
     'Chest up, slight lean back — build the pull-up strength here'),
   'execution', jsonb_build_array(
     'Depress the shoulder blades FIRST, then drive the elbows down and back',
     'Full stretch at the top each rep'),
   'breathing', 'Exhale on the pull, inhale on the stretch',
   'common_mistakes', jsonb_build_array(
     'Yanking with the biceps', 'Leaning back so far it becomes a row'),
   'ruin_your_gains', jsonb_build_array(
     'Pulling with the arms instead of the back — initiate from the shoulder blade or the lats never get the work.')),
 null, null),

('hip-thrust', 'Barbell Hip Thrust', 'glutes', 'hip_hinge',
 '{barbell, bench}', 'beginner', 'medium', 5, '{}',
 jsonb_build_object(
   'setup', jsonb_build_array(
     'Upper back on the bench, bar over the hips (use a pad)',
     'Feet flat, shins vertical at the top'),
   'execution', jsonb_build_array(
     'Chin tucked, ribs down; drive through the heels to full hip extension',
     'Squeeze into a posterior pelvic tilt at the top, lower under control'),
   'breathing', 'Exhale as you drive up',
   'common_mistakes', jsonb_build_array(
     'Hyperextending the lower back at the top instead of tilting the pelvis',
     'Half-range reps / not locking the hips out'),
   'ruin_your_gains', jsonb_build_array(
     'Arching the lumbar to fake extra height — you feel it in your back, not your glutes, and it is the opposite of the goal.')),
 null, null),

('face-pulls', 'Cable Face Pull', 'rear_delt', 'horizontal_pull',
 '{cable}', 'beginner', 'low', 4, '{}',
 jsonb_build_object(
   'setup', jsonb_build_array(
     'Rope at ~eye height, step back for tension, light weight',
     'Tall posture, elbows high'),
   'execution', jsonb_build_array(
     'Pull the rope toward your eyes, hands finishing beside/behind your ears',
     'Add a small external rotation at the end — this is the rotator-cuff/shoulder-health payoff'),
   'breathing', 'Exhale on the pull',
   'common_mistakes', jsonb_build_array(
     'Dropping the elbows (turns into a row)', 'Rushing the reps'),
   'ruin_your_gains', jsonb_build_array(
     'Going too heavy — momentum kills the rear-delt and cuff benefit. This is a control exercise, not an ego one.')),
 null, null)

on conflict (id) do update set
  name              = excluded.name,
  primary_muscle    = excluded.primary_muscle,
  cues              = excluded.cues,
  contraindications = excluded.contraindications,
  stability_demand  = excluded.stability_demand,
  sfr_rating        = excluded.sfr_rating,
  movement_pattern  = excluded.movement_pattern;
