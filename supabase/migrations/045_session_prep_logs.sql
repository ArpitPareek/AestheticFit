-- Migration 035: session prep (warm-up / cool-down) completion tracking
-- Stores which warm-up and stretch items the user checked off for a given
-- training day, synced across devices. One row per (user, date, day, kind);
-- the set of done items lives in completed_keys and is upserted on each toggle.
--
-- Item keys come from src/lib/constants/warmupStretch.ts (stable identifiers).
--
-- ROLLBACK:
--   DROP POLICY IF EXISTS "Users can manage own session_prep_logs" ON session_prep_logs;
--   DROP TABLE IF EXISTS session_prep_logs;

CREATE TABLE IF NOT EXISTS session_prep_logs (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date       date NOT NULL DEFAULT CURRENT_DATE,
  day_label      text NOT NULL,
  kind           text NOT NULL CHECK (kind IN ('warmup','cooldown')),
  completed_keys text[] NOT NULL DEFAULT '{}',
  updated_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, log_date, day_label, kind)
);

CREATE INDEX IF NOT EXISTS idx_session_prep_user_date
  ON session_prep_logs (user_id, log_date);

ALTER TABLE session_prep_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own session_prep_logs"
  ON session_prep_logs
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
