-- 018_neck_shoulder_contraindications.sql
-- Data fix for the deterministic plan generator (Person A's neck/shoulder filter).
-- Per AestheticFit-5month-training-architecture.md "Neck/shoulder safety" section:
--   Exclude: barbell overhead press, behind-neck press/pulldown, heavy barbell
--   upright rows, heavy shrugs. Prefer: neutral-grip DB/landmine pressing,
--   cable/machine over free-weight for overhead patterns.

-------------------------------------------------------------------------------
-- 1. Tag the one existing free-weight overhead-press movement.
--    Standard (pronated) grip DB overhead press is the "prefer neutral-grip
--    instead" case — the generator excludes it for cervical/shoulder profiles.
-------------------------------------------------------------------------------
update exercise_library
   set contraindications = array(select distinct unnest(contraindications || array['shoulder']))
 where id = 'overhead-press-dumbbell';

-------------------------------------------------------------------------------
-- 2. Add the movements named explicitly in the spec's hard-exclude list.
--    They don't exist in the seed library yet; adding them pre-tagged so the
--    shared library is correct for any future user/profile, not just A/B.
-------------------------------------------------------------------------------
insert into exercise_library
  (id, name, primary_muscle, secondary_muscles, movement_pattern, equipment,
   difficulty, instructions, form_cues, common_mistakes, youtube_search_url,
   alternatives, contraindications)
values

('barbell-overhead-press', 'Barbell Overhead Press', 'shoulders', array['triceps','core'],
 'push', array['barbell'], 'intermediate',
 'Stand with the bar at collarbone height, grip just outside shoulders. Brace the core and press overhead to lockout, keeping the bar path close to the face.',
 array['Full-body brace before each rep', 'Squeeze glutes to avoid lower-back arch', 'Bar travels in a straight line overhead'],
 array['Excessive lower-back arch to grind a rep', 'Pressing the bar forward instead of overhead', 'Flaring elbows too wide'],
 'https://www.youtube.com/results?search_query=how+to+barbell+overhead+press+proper+form',
 array['machine-shoulder-press','neutral_grip_db_ohp','overhead-press-dumbbell'],
 array['cervical','shoulder']),

('behind-neck-press', 'Behind-the-Neck Press', 'shoulders', array['triceps'],
 'push', array['barbell'], 'advanced',
 'Bar lowered behind the head to the base of the neck, then pressed overhead. Requires exceptional shoulder mobility; not recommended for most lifters.',
 array['Only for lifters with verified overhead shoulder mobility', 'Light loads only'],
 array['Forcing the bar behind the neck without adequate mobility', 'Loading heavy too soon'],
 'https://www.youtube.com/results?search_query=behind+the+neck+press+risks',
 array['machine-shoulder-press','neutral_grip_db_ohp'],
 array['cervical','shoulder']),

('behind-neck-pulldown', 'Behind-the-Neck Lat Pulldown', 'lats', array['biceps','rear_delt'],
 'pull', array['cable','machine'], 'advanced',
 'Bar pulled down behind the head to the base of the neck rather than to the chest. Places the shoulder in an impinged, externally-rotated position under load.',
 array['Requires excellent shoulder external-rotation mobility', 'Light loads only'],
 array['Rounding the neck forward to make room for the bar', 'Loading heavy too soon'],
 'https://www.youtube.com/results?search_query=behind+the+neck+pulldown+risks',
 array['lat-pulldown','pull-ups','cable-row'],
 array['cervical','shoulder']),

('upright-row', 'Barbell Upright Row', 'shoulders', array['traps','biceps'],
 'pull', array['barbell'], 'intermediate',
 'Pull the bar straight up along the body to chest/collarbone height, leading with the elbows.',
 array['Keep the bar close to the body', 'Stop at chest height, not chin'],
 array['Pulling above chest height (internal shoulder rotation under load)', 'Using a narrow grip which worsens impingement risk'],
 'https://www.youtube.com/results?search_query=barbell+upright+row+shoulder+impingement',
 array['lateral-raises','cable-lateral-raises','face-pulls'],
 array['cervical','shoulder']),

('barbell-shrug', 'Heavy Barbell Shrug', 'traps', array['forearms'],
 'isolation', array['barbell'], 'intermediate',
 'Hold a barbell at arm''s length and elevate the shoulders straight up toward the ears, then lower under control.',
 array['Straight up-and-down path, no rolling', 'Controlled negative'],
 array['Rolling the shoulders (grinds the neck/traps under load)', 'Using momentum/bouncing the weight', 'Excessive load causing neck strain'],
 'https://www.youtube.com/results?search_query=barbell+shrug+form',
 array['dumbbell-row','cable-row'],
 array['cervical','shoulder'])

on conflict (id) do update set
  contraindications = excluded.contraindications;
