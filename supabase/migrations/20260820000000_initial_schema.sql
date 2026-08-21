-- Household calendar schema

-- Households
create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'My Household',
  invite_code text not null unique default substring(replace(gen_random_uuid()::text, '-', '') from 1 for 12),
  created_at timestamptz not null default now()
);

-- Household members
create table public.household_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  unique (household_id, user_id)
);

-- Display settings per household
create table public.display_settings (
  household_id uuid primary key references public.households(id) on delete cascade,
  default_view text not null default 'week' check (default_view in ('week', 'month', 'day')),
  week_starts_on int not null default 0 check (week_starts_on in (0, 1)),
  show_weather boolean not null default true,
  show_clock boolean not null default true,
  show_upcoming boolean not null default true,
  theme text not null default 'system' check (theme in ('light', 'dark', 'system')),
  timezone text not null default 'America/New_York',
  weather_lat double precision,
  weather_lon double precision,
  updated_at timestamptz not null default now()
);

-- Google accounts (tokens managed server-side)
create table public.google_accounts (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  connected_by_user_id uuid references auth.users(id) on delete set null,
  google_email text not null,
  google_sub text not null,
  encrypted_refresh_token text not null,
  access_token text,
  token_expires_at timestamptz,
  created_at timestamptz not null default now(),
  unique (household_id, google_sub)
);

-- Calendars linked to Google accounts
create table public.calendars (
  id uuid primary key default gen_random_uuid(),
  google_account_id uuid not null references public.google_accounts(id) on delete cascade,
  google_calendar_id text not null,
  name text not null,
  color text not null default '#6366f1',
  enabled boolean not null default true,
  is_primary boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (google_account_id, google_calendar_id)
);

-- Indexes
create index idx_household_members_user on public.household_members(user_id);
create index idx_google_accounts_household on public.google_accounts(household_id);
create index idx_calendars_account on public.calendars(google_account_id);

-- Helper: check household membership
create or replace function public.is_household_member(hid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.household_members
    where household_id = hid and user_id = auth.uid()
  );
$$;

create or replace function public.is_household_owner(hid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.household_members
    where household_id = hid and user_id = auth.uid() and role = 'owner'
  );
$$;

-- RLS
alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.display_settings enable row level security;
alter table public.google_accounts enable row level security;
alter table public.calendars enable row level security;

-- Households policies
create policy "Members can view their households"
  on public.households for select
  using (public.is_household_member(id));

create policy "Authenticated users can create households"
  on public.households for insert
  to authenticated
  with check (true);

create policy "Owners can update household"
  on public.households for update
  using (public.is_household_owner(id));

-- Household members policies
create policy "Members can view household members"
  on public.household_members for select
  using (public.is_household_member(household_id));

create policy "Users can join households"
  on public.household_members for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Owners can remove members"
  on public.household_members for delete
  using (public.is_household_owner(household_id) or user_id = auth.uid());

-- Display settings policies
create policy "Members can view display settings"
  on public.display_settings for select
  using (public.is_household_member(household_id));

create policy "Members can insert display settings"
  on public.display_settings for insert
  to authenticated
  with check (public.is_household_member(household_id));

create policy "Members can update display settings"
  on public.display_settings for update
  using (public.is_household_member(household_id));

-- Google accounts: metadata only for clients (no token columns in select view)
create policy "Members can view google account metadata"
  on public.google_accounts for select
  using (public.is_household_member(household_id));

create policy "Members can insert google accounts"
  on public.google_accounts for insert
  to authenticated
  with check (public.is_household_member(household_id));

create policy "Members can delete google accounts"
  on public.google_accounts for delete
  using (public.is_household_member(household_id));

-- Calendars policies
create policy "Members can view calendars"
  on public.calendars for select
  using (
    exists (
      select 1 from public.google_accounts ga
      where ga.id = calendars.google_account_id
        and public.is_household_member(ga.household_id)
    )
  );

create policy "Members can update calendars"
  on public.calendars for update
  using (
    exists (
      select 1 from public.google_accounts ga
      where ga.id = calendars.google_account_id
        and public.is_household_member(ga.household_id)
    )
  );

create policy "Members can insert calendars"
  on public.calendars for insert
  to authenticated
  with check (
    exists (
      select 1 from public.google_accounts ga
      where ga.id = google_account_id
        and public.is_household_member(ga.household_id)
    )
  );

create policy "Members can delete calendars"
  on public.calendars for delete
  using (
    exists (
      select 1 from public.google_accounts ga
      where ga.id = calendars.google_account_id
        and public.is_household_member(ga.household_id)
    )
  );

-- Public view for google accounts without tokens
create or replace view public.google_accounts_public
with (security_invoker = true) as
  select id, household_id, connected_by_user_id, google_email, google_sub, created_at
  from public.google_accounts;

grant select on public.google_accounts_public to authenticated;
