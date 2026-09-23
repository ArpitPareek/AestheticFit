-- Migration 030: cardio_logs table
-- Adds structured cardio session logging (Zone-2 tracking, etc.)
--
-- ROLLBACK:
--   DROP POLICY IF EXISTS "Users can manage own cardio_logs" ON cardio_logs;
--   DROP TABLE IF EXISTS cardio_logs;

CREATE TABLE IF NOT EXISTS cardio_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date    date NOT NULL DEFAULT CURRENT_DATE,
  type        text NOT NULL,
  minutes     int NOT NULL CHECK (minutes > 0),
  intensity   text NOT NULL CHECK (intensity IN ('zone2','low','moderate','high')),
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_cardio_logs_user_date ON cardio_logs (user_id, log_date);

ALTER TABLE cardio_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own cardio_logs"
  ON cardio_logs
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
