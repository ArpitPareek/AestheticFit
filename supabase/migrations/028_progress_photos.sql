-- 028_progress_photos.sql
-- Progress-photo capture + storage for the coach's visual timeline (A + B).
--
-- SAFETY: these are PRIVATE body photos. The bucket is PRIVATE (public=false),
-- every read must go through a short-lived signed URL, and storage RLS confines
-- each user to objects under their OWN auth.uid()/ path prefix
-- (<uid>/<date>/<pose>.jpg). A user can never read/write/delete another user's
-- objects, and the metadata table is RLS'd to auth.uid() = user_id.
--
-- Additive + reversible.
-- ROLLBACK (run top-to-bottom):
--   drop policy if exists "progress_photos_obj_select" on storage.objects;
--   drop policy if exists "progress_photos_obj_insert" on storage.objects;
--   drop policy if exists "progress_photos_obj_update" on storage.objects;
--   drop policy if exists "progress_photos_obj_delete" on storage.objects;
--   drop table if exists progress_photos;              -- drops its own policies + index
--   delete from storage.objects where bucket_id = 'progress-photos';  -- optional: purge files
--   delete from storage.buckets where id = 'progress-photos';

-- ── Private bucket (idempotent; force-private + re-assert limits on re-run) ──
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('progress-photos', 'progress-photos', false, 10485760,
        array['image/jpeg', 'image/webp', 'image/png'])
on conflict (id) do update
  set public          = false,
      file_size_limit = 10485760,
      allowed_mime_types = array['image/jpeg', 'image/webp', 'image/png'];

-- ── Metadata table ──
create table if not exists progress_photos (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users on delete cascade,
  taken_on     date not null,
  pose         text not null check (pose in ('front', 'side', 'back')),
  storage_path text not null,
  created_at   timestamptz not null default now(),
  unique (user_id, taken_on, pose)   -- one photo per pose per day (re-upload replaces)
);

create index if not exists progress_photos_user_date_idx
  on progress_photos (user_id, taken_on desc);

alter table progress_photos enable row level security;

drop policy if exists "progress_photos_select" on progress_photos;
create policy "progress_photos_select" on progress_photos
  for select using (auth.uid() = user_id);

drop policy if exists "progress_photos_insert" on progress_photos;
create policy "progress_photos_insert" on progress_photos
  for insert with check (auth.uid() = user_id);

drop policy if exists "progress_photos_update" on progress_photos;
create policy "progress_photos_update" on progress_photos
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "progress_photos_delete" on progress_photos;
create policy "progress_photos_delete" on progress_photos
  for delete using (auth.uid() = user_id);

-- ── Storage RLS on storage.objects ──
-- RLS is already enabled on storage.objects by Supabase. These policies are
-- scoped to bucket_id = 'progress-photos' so they never affect other buckets.
-- (storage.foldername(name))[1] is the FIRST path segment; requiring it to equal
-- the caller's uid means a user can only touch <their-uid>/… objects. This is
-- the watertight prefix check — a wrong/missing one is what would leak photos.
drop policy if exists "progress_photos_obj_select" on storage.objects;
create policy "progress_photos_obj_select" on storage.objects
  for select using (
    bucket_id = 'progress-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "progress_photos_obj_insert" on storage.objects;
create policy "progress_photos_obj_insert" on storage.objects
  for insert with check (
    bucket_id = 'progress-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "progress_photos_obj_update" on storage.objects;
create policy "progress_photos_obj_update" on storage.objects
  for update using (
    bucket_id = 'progress-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  ) with check (
    bucket_id = 'progress-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "progress_photos_obj_delete" on storage.objects;
create policy "progress_photos_obj_delete" on storage.objects
  for delete using (
    bucket_id = 'progress-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
