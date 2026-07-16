-- Run once in the Supabase SQL editor (Dashboard > SQL Editor > New query).
--
-- Fielding contributions (catches, run-outs) for fantasy scoring — 5 points
-- each. Nothing in the scorecard OCR/import pipeline captures these today
-- (it only reads TT's own batting/bowling figures, never the opposing
-- team's dismissal text where a catch/run-out credit would normally show
-- up), and building that out is a bigger job than this needs right now.
-- Same "manual escape hatch" pattern as tccc_player_match_adjustments: after
-- publishing a match, add a row per player here directly in the Supabase
-- table editor (match_id, player_id, catches, run_outs) — no code change
-- needed, and fantasy points get recalculated the next time that match is
-- re-published (or ask Claude to trigger a recalculation).

create table if not exists tccc_fielding_stats (
  id bigint generated always as identity primary key,
  match_id bigint not null references tccc_matches(id) on delete cascade,
  player_id bigint not null references tccc_players(id) on delete cascade,
  catches int not null default 0,
  run_outs int not null default 0,
  created_at timestamptz not null default now(),
  unique (match_id, player_id)
);

create index if not exists tccc_fielding_stats_match_idx on tccc_fielding_stats (match_id);

notify pgrst, 'reload schema';
