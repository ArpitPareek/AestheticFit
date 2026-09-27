-- 054_wedding_date_column.sql
-- Batch 0 / F10: the wedding countdown lives in localStorage today
-- (PhotoReminder.tsx, ProfilePage.tsx). Storing it on `profiles` moves it to
-- the source of truth per user, syncs across devices, and lets the Batch 2
-- UTC-date fix apply a single localDateISO() parse everywhere.
--
-- Nullable — set by the user in ProfilePage (Batch 5 UI hookup) or via the
-- existing localStorage-migration path.
--
-- Idempotent.

alter table profiles
  add column if not exists wedding_date date;

-- ── verification ─────────────────────────────────────────────────────────────
--   \d profiles                          -- wedding_date column present, nullable
--   select id, display_name, wedding_date from profiles order by created_at;
