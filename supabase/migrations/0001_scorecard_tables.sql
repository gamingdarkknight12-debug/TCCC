-- TCCC scorecard automation schema.
-- Run once in the Supabase SQL editor (Dashboard > SQL Editor > New query).
-- Does not touch the existing teamhub_* tables.

create table if not exists tccc_players (
  id bigint generated always as identity primary key,
  team text not null default 'TT',
  canonical_name text not null,
  role text,
  skill text,
  image_path text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (team, canonical_name)
);

create table if not exists tccc_player_aliases (
  id bigint generated always as identity primary key,
  player_id bigint not null references tccc_players(id) on delete cascade,
  alias text not null,
  unique (alias)
);

create index if not exists tccc_player_aliases_player_id_idx on tccc_player_aliases (player_id);

create table if not exists tccc_matches (
  id bigint generated always as identity primary key,
  team text not null default 'TT',
  league text not null,
  season int not null,
  opponent text not null,
  match_date date not null,
  match_time text,
  ground text,
  home_away text,

  status text not null default 'scheduled'
    check (status in ('scheduled', 'draft', 'published', 'cancelled')),
  source_type text not null default 'manual'
    check (source_type in ('manual', 'pdf', 'image', 'link')),

  result_text text,
  summary_text text,
  mvp_text text,
  mvp_player_id bigint references tccc_players(id),

  team_score text,
  opponent_score text,

  raw_extraction jsonb,
  source_file_name text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tccc_matches_team_season_league_idx on tccc_matches (team, season, league);
create index if not exists tccc_matches_status_idx on tccc_matches (status);

create table if not exists tccc_batting_innings (
  id bigint generated always as identity primary key,
  match_id bigint not null references tccc_matches(id) on delete cascade,
  player_id bigint references tccc_players(id),
  unmatched_name text,
  runs int not null default 0,
  balls int not null default 0,
  fours int not null default 0,
  sixes int not null default 0,
  not_out boolean not null default false,
  dismissal text,
  batting_order int,
  -- Nullable, used only by season-aggregate backfill rows (one row standing in for
  -- a whole season): a single real match innings leaves these null (innings = 1
  -- implicitly, not_out is the boolean above). Lets Phase 2 preserve the exact
  -- season averages/innings counts that already exist in app/data.js today.
  innings int,
  not_out_count int,
  avg numeric(6,2),
  created_at timestamptz not null default now()
);

create index if not exists tccc_batting_innings_match_id_idx on tccc_batting_innings (match_id);
create index if not exists tccc_batting_innings_player_id_idx on tccc_batting_innings (player_id);

create table if not exists tccc_bowling_innings (
  id bigint generated always as identity primary key,
  match_id bigint not null references tccc_matches(id) on delete cascade,
  player_id bigint references tccc_players(id),
  unmatched_name text,
  overs numeric(4,1) not null default 0,
  runs int not null default 0,
  wickets int not null default 0,
  wides int not null default 0,
  no_balls int not null default 0,
  dots int,
  maidens int,
  created_at timestamptz not null default now()
);

create index if not exists tccc_bowling_innings_match_id_idx on tccc_bowling_innings (match_id);
create index if not exists tccc_bowling_innings_player_id_idx on tccc_bowling_innings (player_id);

create table if not exists tccc_news_items (
  id bigint generated always as identity primary key,
  team text not null default 'TT',
  match_id bigint references tccc_matches(id) on delete set null,
  kind text not null default 'match_recap'
    check (kind in ('match_recap', 'manual', 'player_highlight')),
  placement text not null default 'small'
    check (placement in ('carousel', 'main', 'small')),
  tag text,
  title text not null,
  body text not null,
  image_path text,
  status text not null default 'draft'
    check (status in ('draft', 'published')),
  published_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists tccc_news_items_status_published_idx on tccc_news_items (status, published_at desc);
