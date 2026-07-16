-- Run once in the Supabase SQL editor (Dashboard > SQL Editor > New query).
--
-- Fantasy scoring changed from "accumulate raw points forever" to "win the
-- match, earn 1 league point" (real prize money rides on the season
-- standings, so per-match wins are what get counted, not raw point totals).
-- fantasy_scores.points now holds the LEAGUE point awarded for that match
-- (0, or 1 for every squad tied at the top that match — ties all get full
-- credit, not a split). raw_points keeps the underlying 1pt/run + 20pt/wicket
-- (Captain x2, Vice-Captain x1.5) score that determined the winner, so the
-- numbers behind any given week's result stay auditable.
alter table fantasy_scores add column if not exists raw_points numeric not null default 0;

notify pgrst, 'reload schema';
