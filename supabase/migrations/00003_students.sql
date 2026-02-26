-- Milestone 2: Students table — minimal fields for registration gating.
--
-- Ownership: student belongs to exactly one family account (family_account_id = auth.uid()).
-- registration_complete is derived by application logic but stored for query convenience.

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  family_account_id uuid not null references auth.users(id),
  first_name text,
  last_name text,
  grade text,
  photo_storage_path text,
  registration_complete boolean not null default false,
  callback_invited boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by_user_id uuid references auth.users(id),
  updated_by_user_id uuid references auth.users(id)
);

-- RLS
alter table public.students enable row level security;

-- Families can read only their own students
create policy "Families can read own students"
  on public.students for select
  using (family_account_id = auth.uid());

-- Families can insert students for themselves
create policy "Families can create own students"
  on public.students for insert
  with check (family_account_id = auth.uid());

-- Families can update only their own students
create policy "Families can update own students"
  on public.students for update
  using (family_account_id = auth.uid())
  with check (family_account_id = auth.uid());

-- Staff can read all students (for rosters, profiles)
create policy "Staff can read all students"
  on public.students for select
  using (
    exists (
      select 1 from public.staff_profiles
      where id = auth.uid()
    )
  );

-- Admins can update any student (overrides)
create policy "Admins can update any student"
  on public.students for update
  using (
    exists (
      select 1 from public.staff_profiles
      where id = auth.uid() and role = 'admin'
    )
  );
