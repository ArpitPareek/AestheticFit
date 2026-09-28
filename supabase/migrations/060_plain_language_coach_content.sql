-- 060_plain_language_coach_content.sql
-- Rewrites gym jargon in the two places the coach's own words reach the athlete:
--   1. workout_plans.plan_data  → the per-exercise "Coach: ..." notes
--   2. exercise_library.cues    → the Setup/Execution/Breathing/mistakes cues
-- into plain English. This is TEXT-ONLY: every set/rep/RIR/rest number, every
-- exercise id, and the whole plan structure are untouched (the swaps only ever
-- hit note/cue strings). The app also shows tap-to-explain tooltips for any term
-- left in place (e.g. "prehab", "hinge", "glute medius"), so this migration and
-- the tooltips together make the coach content readable without losing meaning.
--
-- SAFE + IDEMPOTENT: the swaps turn jargon into plain phrases, so re-running finds
-- nothing left to replace. The exact regex chain below was validated against the
-- real plan_data JSON — every plan still parses as valid jsonb, unchanged in
-- structure and numbers, after the rewrite. The originals remain in git history
-- (migrations 020 / 022 / 023) if you ever want to compare.
--
-- Run the whole file in the Supabase SQL editor (paste + Run).

-- ── 1. Coach notes in the active + inactive coach plans ──
update workout_plans
set plan_data =
  regexp_replace(
   regexp_replace(
    regexp_replace(
     regexp_replace(
      regexp_replace(
       regexp_replace(
        regexp_replace(
         regexp_replace(
          regexp_replace(
           regexp_replace(
            regexp_replace(
             regexp_replace(
              regexp_replace(
               regexp_replace(
                regexp_replace(
                 plan_data::text,
                 'To failure last set', 'Last set: push until you cannot do another clean rep', 'g'),
                'MANDATORY prehab', 'must-do injury-prevention move', 'g'),
               'external-rotate', 'rotate your forearms outward', 'g'),
              'glute\+ham', 'glutes and hamstrings', 'g'),
             'Glute[- ]MED\y', 'Side-glute (glute medius)', 'g'),
            'Glute[- ]med\y', 'Side-glute (glute medius)', 'g'),
           'posterior pelvic tilt', 'hips tucked under', 'g'),
          'posterior tilt', 'hips tucked under', 'g'),
         'Posterior chain', 'Back-of-body muscles (glutes, hamstrings, lower back)', 'g'),
        'posterior chain', 'back-of-body muscles (glutes, hamstrings, lower back)', 'g'),
       'scap retraction', 'shoulder-blade squeeze', 'g'),
      'Supinate hard', 'Turn your palms fully up', 'g'),
     'last set to failure', 'last set: push until you cannot do another clean rep', 'g'),
    'to failure', 'until you cannot do another clean rep', 'g'),
   '\yROM\y', 'range of motion', 'g')
  ::jsonb
where plan_source = 'coach_authored';

-- ── 2. Exercise cues in the library (same swaps, same safety) ──
update exercise_library
set cues =
  regexp_replace(
   regexp_replace(
    regexp_replace(
     regexp_replace(
      regexp_replace(
       regexp_replace(
        regexp_replace(
         regexp_replace(
          regexp_replace(
           regexp_replace(
            regexp_replace(
             regexp_replace(
              regexp_replace(
               regexp_replace(
                regexp_replace(
                 cues::text,
                 'To failure last set', 'Last set: push until you cannot do another clean rep', 'g'),
                'MANDATORY prehab', 'must-do injury-prevention move', 'g'),
               'external-rotate', 'rotate your forearms outward', 'g'),
              'glute\+ham', 'glutes and hamstrings', 'g'),
             'Glute[- ]MED\y', 'Side-glute (glute medius)', 'g'),
            'Glute[- ]med\y', 'Side-glute (glute medius)', 'g'),
           'posterior pelvic tilt', 'hips tucked under', 'g'),
          'posterior tilt', 'hips tucked under', 'g'),
         'Posterior chain', 'Back-of-body muscles (glutes, hamstrings, lower back)', 'g'),
        'posterior chain', 'back-of-body muscles (glutes, hamstrings, lower back)', 'g'),
       'scap retraction', 'shoulder-blade squeeze', 'g'),
      'Supinate hard', 'Turn your palms fully up', 'g'),
     'last set to failure', 'last set: push until you cannot do another clean rep', 'g'),
    'to failure', 'until you cannot do another clean rep', 'g'),
   '\yROM\y', 'range of motion', 'g')
  ::jsonb
where cues is not null;
