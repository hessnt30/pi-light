-- Allow household members to update google account token fields (server-side refresh)
create policy "Members can update google accounts"
  on public.google_accounts for update
  using (public.is_household_member(household_id));
