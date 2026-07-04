-- Recreates the pre-existing Team Hub tables in the new Supabase project.
-- Column shapes copied exactly from app/api/teamhub/route.js and the actual
-- exported data (scripts/teamhub-export.json), so app/components/sections/TeamHub.js
-- keeps working unchanged.
-- Run this BEFORE 0001_scorecard_tables.sql in the new project's SQL Editor.

create table if not exists teamhub_polls (
  id bigint generated always as identity primary key,
  poll_name text not null,
  option_name text not null,
  votes int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists teamhub_locker_notes (
  id bigint generated always as identity primary key,
  note text not null,
  created_at timestamptz not null default now()
);

create table if not exists teamhub_captain_notes (
  id bigint generated always as identity primary key,
  note text not null,
  player_name text not null,
  created_at timestamptz not null default now()
);

create table if not exists teamhub_roast_names (
  id bigint generated always as identity primary key,
  player_name text not null,
  roast_name text not null,
  created_at timestamptz not null default now()
);
