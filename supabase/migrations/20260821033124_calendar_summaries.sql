-- Persisted Ollama calendar summaries, one row per household + period + range

create table public.calendar_summaries (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  period text not null check (period in ('day', 'week', 'month')),
  range_start timestamptz not null,
  range_end timestamptz not null,
  text text not null,
  event_count int not null default 0,
  model text not null,
  generated_at timestamptz not null default now(),
  unique (household_id, period, range_start)
);

create index calendar_summaries_household_id_idx
  on public.calendar_summaries (household_id);

alter table public.calendar_summaries enable row level security;

create policy "Members can view calendar summaries"
  on public.calendar_summaries for select
  using (public.is_household_member(household_id));

create policy "Members can insert calendar summaries"
  on public.calendar_summaries for insert
  to authenticated
  with check (public.is_household_member(household_id));

create policy "Members can update calendar summaries"
  on public.calendar_summaries for update
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));
