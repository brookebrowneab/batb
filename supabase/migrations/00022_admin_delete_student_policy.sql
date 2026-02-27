-- Allow admins to delete any student registration (useful for clearing test data).

create policy "Admins can delete any student"
  on public.students for delete
  using (
    exists (
      select 1
      from public.staff_profiles
      where id = auth.uid()
        and role = 'admin'
    )
  );
