-- 043_food_match_fn.sql
-- F2 support — trigram fuzzy-match RPC for the parse-meal edge function.
-- Wraps food_library (name + embedded aliases[]) and food_aliases behind one
-- call so a single postgrest .rpc() invocation returns the best candidate(s)
-- for a free-text food name, ranked by pg_trgm similarity. Read-only, STABLE,
-- and granted to authenticated — both source tables are already
-- authenticated-readable (migrations 007, 041), so this grants no new access.
--
-- Not a "shared file" for the edge function's single-file constraint — that
-- constraint is about the Deno function source only, so the fuzzy-match
-- SQL logic lives here instead of being duplicated in JS.
--
-- ROLLBACK:
--   drop function if exists match_food_fuzzy(text, int);

create or replace function match_food_fuzzy(p_query text, p_limit int default 3)
returns table (food_id text, matched_name text, similarity real, match_source text)
language sql
stable
as $$
  select id as food_id, name as matched_name, similarity(name, p_query) as similarity,
         'name'::text as match_source
  from food_library
  where name % p_query

  union all

  select fl.id as food_id, a as matched_name, similarity(a, p_query) as similarity,
         'embedded_alias'::text as match_source
  from food_library fl, unnest(fl.aliases) as a
  where a % p_query

  union all

  select fa.food_id, fa.alias_text as matched_name, similarity(fa.alias_text, p_query) as similarity,
         'alias_table'::text as match_source
  from food_aliases fa
  where fa.alias_text % p_query

  order by similarity desc
  limit p_limit;
$$;

grant execute on function match_food_fuzzy(text, int) to authenticated;
