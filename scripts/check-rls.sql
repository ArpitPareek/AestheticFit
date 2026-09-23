-- check-rls.sql
-- Paste into the Supabase SQL Editor.
-- Lists any public-schema table with RLS disabled.
-- Expected result: ZERO rows when schema is clean.
-- Re-run after every migration.

SELECT
  t.tablename      AS table_name,
  c.relrowsecurity AS rls_enabled
FROM
  pg_tables       t
  JOIN pg_class   c ON c.relname   = t.tablename
  JOIN pg_namespace n ON n.oid     = c.relnamespace
                      AND n.nspname = t.schemaname
WHERE
  t.schemaname = 'public'
  AND c.relkind = 'r'          -- ordinary tables only (not views / partitions)
  AND NOT c.relrowsecurity     -- RLS is OFF
ORDER BY
  t.tablename;
