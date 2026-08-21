-- Fix household provisioning: atomic RPC bypasses SELECT-after-INSERT RLS gap

create or replace function public.provision_household(household_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_household_id uuid := gen_random_uuid();
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  if exists (select 1 from public.household_members where user_id = uid) then
    raise exception 'User already belongs to a household';
  end if;

  insert into public.households (id, name)
  values (new_household_id, household_name);

  insert into public.household_members (household_id, user_id, role)
  values (new_household_id, uid, 'owner');

  insert into public.display_settings (household_id)
  values (new_household_id);

  return new_household_id;
end;
$$;

grant execute on function public.provision_household(text) to authenticated;
