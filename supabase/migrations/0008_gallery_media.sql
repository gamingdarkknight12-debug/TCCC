-- Run once in the Supabase SQL editor (Dashboard > SQL Editor > New query).
--
-- Admin-uploaded gallery photos. The 121 pre-existing gallery files are NOT
-- migrated here — they stay exactly as-is as static files under
-- public/gallery/** and hardcoded in app/components/sections/Gallery.js.
-- This table only holds new items uploaded through the admin "Gallery
-- Photos" tab going forward; Gallery.js merges both sources at render time.
-- Actual image bytes live in the Supabase Storage "gallery" bucket
-- (created via scripts/create-gallery-bucket.mjs, not SQL); storage_path
-- is the object path within that bucket.

create table if not exists tccc_gallery_media (
  id bigint generated always as identity primary key,
  year text not null,
  sub_tab text,
  media_type text not null check (media_type in ('image','video')),
  storage_path text not null,
  caption text,
  created_at timestamptz not null default now()
);

create index if not exists tccc_gallery_media_year_subtab_idx on tccc_gallery_media (year, sub_tab);

notify pgrst, 'reload schema';
