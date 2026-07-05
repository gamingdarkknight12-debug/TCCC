-- Attaches a match date to each poll so the site can automatically switch a
-- poll from voting to results once that match day arrives, instead of one
-- hardcoded global reveal date for every poll ever created.
alter table teamhub_polls add column if not exists match_date date;

notify pgrst, 'reload schema';
