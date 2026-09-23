-- 019_deprecated_exercises_and_calves.sql
-- (a) `deprecated` is a GLOBAL exclusion, distinct from per-user contraindication
--     tags: behind-neck variants and upright rows are inadvisable for everyone's
--     shoulders, not just users with a logged cervical/shoulder injury. The
--     generator must exclude deprecated=true from both primary selection and
--     alternatives for ALL users.
-- (b) Adds standing/seated calf raise — the library had zero calf exercises,
--     leaving every "Calf" slot in the architecture doc's sample weeks unfillable.

alter table exercise_library
  add column if not exists deprecated boolean not null default false;

update exercise_library
   set deprecated = true
 where id in ('behind-neck-press', 'behind-neck-pulldown', 'upright-row');
-- Note: barbell-overhead-press and barbell-shrug stay deprecated=false — they're
-- legitimate exercises for lifters without cervical/shoulder issues; only the
-- per-user contraindications filter excludes them (see 018).

insert into exercise_library
  (id, name, primary_muscle, secondary_muscles, movement_pattern, equipment,
   difficulty, instructions, form_cues, common_mistakes, youtube_search_url, alternatives)
values

('standing-calf-raise', 'Standing Calf Raise', 'calves', array[]::text[], 'isolation',
 array['machine', 'barbell', 'dumbbell'], 'beginner',
 'Stand on a raised platform (or under a standing calf machine) with the balls of your feet on the edge. Lower your heels below the platform for a full stretch, then rise onto your toes as high as possible.',
 array['Full stretch at the bottom', 'Pause and squeeze at the top', 'Controlled tempo — do not bounce', 'Keep knees straight but not locked'],
 array['Bouncing out of the bottom stretch', 'Partial range of motion', 'Using momentum instead of the calf', 'Rushing the tempo'],
 'https://www.youtube.com/results?search_query=how+to+standing+calf+raise+proper+form',
 array['seated-calf-raise']),

('seated-calf-raise', 'Seated Calf Raise', 'calves', array[]::text[], 'isolation',
 array['machine'], 'beginner',
 'Sit at a seated calf raise machine with the pads across your lower thighs and the balls of your feet on the platform. Lower your heels for a full stretch, then press up onto your toes.',
 array['Full stretch at the bottom', 'Pause and squeeze at the top', 'Controlled tempo — do not bounce', 'Knees bent throughout (targets soleus)'],
 array['Bouncing out of the bottom stretch', 'Partial range of motion', 'Going too heavy with half reps'],
 'https://www.youtube.com/results?search_query=how+to+seated+calf+raise+proper+form',
 array['standing-calf-raise'])

on conflict (id) do nothing;
