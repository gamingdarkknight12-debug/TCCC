-- Run once in the Supabase SQL editor (Dashboard > SQL Editor > New query).
--
-- Season-long fantasy league for the friend group: each entrant picks 2
-- batters + 2 bowlers from the TT roster plus a Captain/Vice-Captain among
-- those 4, and earns points from those players' real match performances.
-- A team is considered "locked" (picks can no longer be edited) simply by
-- having any row in fantasy_scores — no separate boolean needed, since a
-- team only gets a score row once a real match it's eligible for has been
-- published and scored.

create table if not exists fantasy_teams (
  id bigint generated always as identity primary key,
  owner_name text not null,
  season int not null default 2026,
  batter1_id bigint not null references tccc_players(id),
  batter2_id bigint not null references tccc_players(id),
  bowler1_id bigint not null references tccc_players(id),
  bowler2_id bigint not null references tccc_players(id),
  captain_player_id bigint not null references tccc_players(id),
  vice_captain_player_id bigint not null references tccc_players(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists fantasy_scores (
  id bigint generated always as identity primary key,
  fantasy_team_id bigint not null references fantasy_teams(id) on delete cascade,
  match_id bigint not null references tccc_matches(id) on delete cascade,
  points numeric not null default 0,
  created_at timestamptz not null default now(),
  unique (fantasy_team_id, match_id)
);

create index if not exists fantasy_scores_team_idx on fantasy_scores (fantasy_team_id);
create index if not exists fantasy_teams_season_idx on fantasy_teams (season);
