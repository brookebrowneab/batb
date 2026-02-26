-- Milestone 1: Staff profiles table for role-based access control.
--
-- Role detection approach: profile table lookup (not JWT custom claims).
-- If a user has a row in staff_profiles, they are staff (admin or director).
-- If no row exists, the authenticated user is treated as a family user.

create table if not exists public.staff_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'director')),
  display_name text not null,
  email text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS: staff can read their own profile; all staff can read all profiles
-- (needed for admin to see director list later).
-- Families cannot read staff_profiles at all.
alter table public.staff_profiles enable row level security;

-- Staff can read all staff profiles (needed for role checks and admin views)
create policy "Staff can read all staff profiles"
  on public.staff_profiles for select
  using (
    exists (
      select 1 from public.staff_profiles sp
      where sp.id = auth.uid()
    )
  );

-- Staff can update their own profile only
create policy "Staff can update own profile"
  on public.staff_profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- Only service role (admin backend) can insert/delete staff profiles.
-- No insert/delete policies for authenticated users — managed via Supabase dashboard or seed scripts.

-- Allow authenticated users to read their own profile for role detection.
-- This is the key policy: any authenticated user can check if they have a staff profile.
create policy "Authenticated users can read own staff profile"
  on public.staff_profiles for select
  using (id = auth.uid());
