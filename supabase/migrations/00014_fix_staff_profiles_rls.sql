-- Fix infinite recursion in staff_profiles RLS.
-- The "Staff can read all staff profiles" policy queries staff_profiles itself,
-- which triggers RLS evaluation again, causing infinite recursion.
-- Replace with a non-recursive approach using auth.uid() direct check.

drop policy if exists "Staff can read all staff profiles" on public.staff_profiles;

-- The "Authenticated users can read own staff profile" policy (id = auth.uid())
-- already handles role detection. For admin views that need all staff profiles,
-- use a SECURITY DEFINER function instead.

create or replace function public.fetch_all_staff_profiles()
returns setof public.staff_profiles
language sql
security definer
set search_path = public
as $$
  -- Only return results if the caller is staff
  select sp.*
  from public.staff_profiles sp
  where exists (
    select 1 from public.staff_profiles
    where id = auth.uid()
  );
$$;
