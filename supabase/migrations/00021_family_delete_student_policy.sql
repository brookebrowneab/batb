-- Allow families to clear a registration by deleting their own student row.
-- Related rows (acceptances, bookings, assignments, preferences, etc.) are removed via ON DELETE CASCADE.

create policy "Families can delete own students"
  on public.students for delete
  using (family_account_id = auth.uid());
