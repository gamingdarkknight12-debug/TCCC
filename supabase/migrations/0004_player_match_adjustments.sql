-- Run once in the Supabase SQL editor (Dashboard > SQL Editor > New query).
--
-- Some seasons have matches a player actually played that never produced a
-- batting or bowling stat row anywhere (e.g. fielded only, or the match
-- predates per-match tracking and only exists in a rolled-up "SEASON"
-- aggregate row). /api/stats infers "matches played" purely from having a
-- batting/bowling row, so those matches are invisible to it. This table is
-- the escape hatch: a manually-verified correction per player/season, added
-- on top of what's computed from real rows. Edit this table directly
-- (Supabase table editor) to correct a count — no code change needed.

create table if not exists tccc_player_match_adjustments (
  id bigint generated always as identity primary key,
  player_id bigint not null references tccc_players(id) on delete cascade,
  season int not null,
  extra_matches int not null default 0,
  note text,
  created_at timestamptz not null default now(),
  unique (player_id, season)
);

create index if not exists tccc_player_match_adjustments_season_idx
  on tccc_player_match_adjustments (season);
