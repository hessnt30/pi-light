-- Distinguish Google Calendar feeds from Google Tasks lists in the calendars table

alter table public.calendars
  add column source text not null default 'google_calendar'
  check (source in ('google_calendar', 'google_tasks'));

create index idx_calendars_source on public.calendars (source);
