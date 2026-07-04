-- Adds a structured win/loss/no-result/tie field to matches, so the Standings
-- page can compute Telugu Titans' own record reliably instead of guessing
-- from the free-text result sentence.
-- Run this in the SQL Editor for the TCCC (bmwafsvgmbsjmotwwete) project.

alter table tccc_matches
  add column if not exists result_type text
    check (result_type in ('win', 'loss', 'no_result', 'tie'));

-- One-time backfill for the 5 matches already published from Phase 1,
-- inferred from their existing result_text.
update tccc_matches set result_type = 'win'
  where status = 'published' and result_text ilike '%won%' and result_type is null;

update tccc_matches set result_type = 'loss'
  where status = 'published' and result_text ilike 'lost%' and result_type is null;

update tccc_matches set result_type = 'no_result'
  where status = 'cancelled' and result_type is null;

notify pgrst, 'reload schema';
