-- Milestone 4: Audition window configuration — director-editable scheduling settings.
--
-- One row per audition date. Directors/admins can edit; families read-only.
-- Lock time policy stored for transparency (always 14:00 local).

create table if not exists public.audition_window_config (
  id uuid primary key default gen_random_uuid(),
  audition_date date not null,
  dance_start_time time,
  dance_end_time time,
  vocal_start_time time,
  vocal_end_time time,
  callback_start_time time,
  callback_end_time time,
  lock_time_rule text not null default '14:00 local day-of',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by_staff_user_id uuid references auth.users(id)
);

-- One config per date
create unique index audition_window_config_date_idx
  on public.audition_window_config(audition_date);

-- RLS
alter table public.audition_window_config enable row level security;

-- Authenticated users can read config (families need dates/times for display)
create policy "Authenticated users can read config"
  on public.audition_window_config for select
  using (auth.uid() is not null);

-- Directors and admins can insert config
create policy "Staff can create config"
  on public.audition_window_config for insert
  with check (
    exists (
      select 1 from public.staff_profiles
      where id = auth.uid()
    )
  );

-- Directors and admins can update config
create policy "Staff can update config"
  on public.audition_window_config for update
  using (
    exists (
      select 1 from public.staff_profiles
      where id = auth.uid()
    )
  );

-- Only admins can delete config
create policy "Admins can delete config"
  on public.audition_window_config for delete
  using (
    exists (
      select 1 from public.staff_profiles
      where id = auth.uid() and role = 'admin'
    )
  );
