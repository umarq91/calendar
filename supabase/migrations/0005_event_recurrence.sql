-- Recurrence + exclusion dates per event.
-- `rrule` stores the RFC 5545 RRULE value (without the `RRULE:` prefix), e.g.
--   FREQ=WEEKLY;BYDAY=TU;UNTIL=20260801T180000Z
-- `exdates` stores UTC timestamps for occurrences the organizer wants to skip.
-- Both nullable / empty for one-time events.

alter table public.events
  add column rrule text,
  add column exdates timestamptz[] not null default '{}';
