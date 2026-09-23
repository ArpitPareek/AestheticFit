-- 022_coach_plan_exercises.sql
-- The 5 library rows the coach-authored plans reference that migration 020's
-- canonical set didn't include. Every OTHER id in both coach plans (incl. all
-- alternatives — banded-glute-bridge, cable-pull-through, bird-dog,
-- ab-wheel-rollout, good-mornings, t-bar-row, barbell-squat, glute-bridge, …)
-- already exists after 020, verified by diffing every ref+alternative id.
--
-- Same column set + jsonb cue shape as 020 (migration-017 shape:
-- setup/execution/breathing/common_mistakes/ruin_your_gains). primary_muscle
-- and movement_pattern use the EXISTING app vocabulary only.
--
-- Provenance of each field:
--   cues + attributes (primary_muscle, movement_pattern, equipment, difficulty,
--     sfr_rating, contraindications) = coach doc "LIBRARY ADDITIONS NEEDED".
--   stability_demand: coach "moderate" mapped -> 'medium' (the column check
--     allows only low/medium/high) for landmine-press & incline-push-up; the
--     other three are 'low' as specced.
--   gif_url: static jpg vendored into public/exercise-media/<id>/0.jpg from
--     yuhonas/free-exercise-db (Unlicense / public domain), matching 020:
--       incline-push-up       <- Incline_Push-Up/0.jpg        (exact)
--       assisted-pull-up      <- Band_Assisted_Pull-Up/0.jpg  (band-assisted pull-up)
--       hip-abduction-machine <- Thigh_Abductor/0.jpg         (seated abductor machine)
--       cable-glute-kickback  <- One-Legged_Cable_Kickback/0.jpg (cable glute kickback)
--     landmine-press: NO faithful match in free-exercise-db (only a "Linear
--       Jammer" variant) -> gif_url/media left null, per "leave null if no match".
--   Unlisted columns (secondary_muscles, instructions, form_cues,
--     common_mistakes text[], youtube_search_url, youtube_id, alternatives)
--     stay at table defaults, exactly as the 020 canonical rows do.

insert into exercise_library
  (id, name, primary_muscle, movement_pattern, equipment, difficulty,
   stability_demand, sfr_rating, contraindications, deprecated, cues,
   gif_url, media_attribution, media_license)
values

  ('landmine-press', 'Landmine Press', 'front_delt', 'vertical_press',
   array['barbell','landmine'], 'beginner',
   'medium', 4, array[]::text[], false,
   jsonb_build_object(
     'setup', jsonb_build_array(
       'Barbell butt in landmine, load the sleeve end',
       'Stand staggered or half-kneel, bar in one or both hands at shoulder',
       'Ribs down, brace, neutral neck'),
     'execution', jsonb_build_array(
       'Press up-and-forward along the bar''s arc',
       'Stop just short of full elbow lock',
       'Lower under control to the front-delt stretch'),
     'breathing', 'Inhale at shoulder, exhale through the press',
     'common_mistakes', jsonb_build_array(
       'Leaning back to turn it into an incline press',
       'Shrugging the bar up with traps',
       'Flaring ribs / arching low back'),
     'ruin_your_gains', jsonb_build_array(
       'Going so heavy it becomes a push-press — the point is a controlled, neck-safe vertical stimulus')),
   null, null, null),

  ('incline-push-up', 'Incline Push-Up', 'chest', 'horizontal_press',
   array['bodyweight','bench','smith-machine-bar'], 'beginner',
   'medium', 4, array['wrist'], false,
   jsonb_build_object(
     'setup', jsonb_build_array(
       'Hands on a raised surface (higher = easier), slightly wider than shoulders',
       'Body in a straight line, glutes and core braced',
       'Higher bar to start; lower the surface to progress'),
     'execution', jsonb_build_array(
       'Lower chest to the surface with elbows ~45°',
       'Press away, spreading the floor/bar',
       'Full lockout, no hip sag'),
     'breathing', 'Inhale down, exhale up',
     'common_mistakes', jsonb_build_array(
       'Hips sagging or piking',
       'Elbows flaring to 90°',
       'Half reps'),
     'ruin_your_gains', jsonb_build_array(
       'Staying on the same height forever — progress by LOWERING the surface toward the floor, that''s the whole ladder')),
   '/exercise-media/incline-push-up/0.jpg', 'free-exercise-db (yuhonas)', 'Unlicense (public domain)'),

  ('assisted-pull-up', 'Assisted Pull-Up', 'lats', 'vertical_pull',
   array['assisted-pull-up-machine','resistance-band'], 'beginner',
   'low', 4, array[]::text[], false,
   jsonb_build_object(
     'setup', jsonb_build_array(
       'Set assistance (machine pad or band) — MORE assistance = easier',
       'Grip slightly wider than shoulders, hang with shoulders packed down'),
     'execution', jsonb_build_array(
       'Pull elbows down and back, drive chest to the bar',
       'Chin over bar without craning the neck',
       'Lower under control to a full hang'),
     'breathing', 'Exhale up, inhale on the descent',
     'common_mistakes', jsonb_build_array(
       'Kipping/swinging for momentum',
       'Half range at the bottom',
       'Neck straining to clear the bar'),
     'ruin_your_gains', jsonb_build_array(
       'Judging progress by reps at fixed assistance — the metric is assistance load FALLING over weeks as she leans out')),
   '/exercise-media/assisted-pull-up/0.jpg', 'free-exercise-db (yuhonas)', 'Unlicense (public domain)'),

  ('hip-abduction-machine', 'Hip Abduction (Machine)', 'glutes', 'isolation',
   array['machine'], 'beginner',
   'low', 5, array[]::text[], false,
   jsonb_build_object(
     'setup', jsonb_build_array(
       'Seated, pads on outer thighs',
       'Lean torso slightly FORWARD to bias glute medius/upper glute'),
     'execution', jsonb_build_array(
       'Push knees apart, pause 1s at end range',
       'Return slow, resist the stack',
       'Keep the drive in the glute, not leaning the torso side to side'),
     'breathing', 'Exhale opening, inhale returning',
     'common_mistakes', jsonb_build_array(
       'Bouncing the stack',
       'Sitting bolt upright (less glute-med)',
       'Using momentum from the torso'),
     'ruin_your_gains', jsonb_build_array(
       'Rushing — this is high-rep squeeze work; slow eccentrics and end-range pauses are the point')),
   '/exercise-media/hip-abduction-machine/0.jpg', 'free-exercise-db (yuhonas)', 'Unlicense (public domain)'),

  ('cable-glute-kickback', 'Cable Glute Kickback', 'glutes', 'isolation',
   array['cable','ankle-strap'], 'beginner',
   'low', 4, array['lower_back'], false,
   jsonb_build_object(
     'setup', jsonb_build_array(
       'Ankle strap on low cable, face the stack',
       'Slight hip hinge, brace core, soft support-knee'),
     'execution', jsonb_build_array(
       'Drive the heel back and up via the glute, pause 1s',
       'Squeeze at the top without arching the low back',
       'Return slow, full hip-flexion stretch'),
     'breathing', 'Exhale kicking back, inhale returning',
     'common_mistakes', jsonb_build_array(
       'Arching the lumbar to gain range',
       'Swinging the leg with momentum',
       'Rotating the hip open'),
     'ruin_your_gains', jsonb_build_array(
       'Yanking with the low back instead of the glute — keep it strict, moderate load, feel the glute')),
   '/exercise-media/cable-glute-kickback/0.jpg', 'free-exercise-db (yuhonas)', 'Unlicense (public domain)')

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
