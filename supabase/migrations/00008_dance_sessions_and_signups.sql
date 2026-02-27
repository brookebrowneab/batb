-- Milestone 5: Dance sessions and sign-ups.
--
-- dance_sessions: generated from audition_window_config or created manually by staff.
-- dance_signups: exactly one per student, mutations via RPCs only (lock time + ownership enforced).

-- ============================================================
-- Table: dance_sessions
-- ============================================================

create table if not exists public.dance_sessions (
  id uuid primary key default gen_random_uuid(),
  audition_date date not null,
  start_time time not null,
  end_time time not null,
  capacity integer,  -- null = unlimited
  label text,        -- optional display label, e.g. "Morning Session"
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by_staff_user_id uuid references auth.users(id)
);

-- One session per date+start_time
create unique index dance_sessions_date_time_idx
  on public.dance_sessions(audition_date, start_time);

alter table public.dance_sessions enable row level security;

-- All authenticated users can read sessions (families need to see available sessions)
create policy "Authenticated users can read dance sessions"
  on public.dance_sessions for select
  using (auth.uid() is not null);

-- Staff can create sessions
create policy "Staff can create dance sessions"
  on public.dance_sessions for insert
  with check (
    exists (
      select 1 from public.staff_profiles
      where id = auth.uid()
    )
  );

-- Staff can update sessions
create policy "Staff can update dance sessions"
  on public.dance_sessions for update
  using (
    exists (
      select 1 from public.staff_profiles
      where id = auth.uid()
    )
  );

-- Only admins can delete sessions
create policy "Admins can delete dance sessions"
  on public.dance_sessions for delete
  using (
    exists (
      select 1 from public.staff_profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ============================================================
-- Table: dance_signups
-- ============================================================

create table if not exists public.dance_signups (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  dance_session_id uuid not null references public.dance_sessions(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by_user_id uuid references auth.users(id),
  updated_by_user_id uuid references auth.users(id)
);

-- Exactly one dance sign-up per student
create unique index dance_signups_student_idx
  on public.dance_signups(student_id);

alter table public.dance_signups enable row level security;

-- Families can read their own student's sign-ups
create policy "Families can read own dance signups"
  on public.dance_signups for select
  using (
    exists (
      select 1 from public.students
      where students.id = dance_signups.student_id
        and students.family_account_id = auth.uid()
    )
  );

-- Staff can read all sign-ups (for roster)
create policy "Staff can read all dance signups"
  on public.dance_signups for select
  using (
    exists (
      select 1 from public.staff_profiles
      where id = auth.uid()
    )
  );

-- No direct INSERT/UPDATE/DELETE policies for families.
-- All mutations go through SECURITY DEFINER RPCs below.

-- ============================================================
-- RPC: upsert_dance_signup (family use)
-- ============================================================

create or replace function public.upsert_dance_signup(
  p_student_id uuid,
  p_dance_session_id uuid
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_family_id uuid;
  v_reg_complete boolean;
  v_audition_date date;
  v_capacity integer;
  v_current_count integer;
  v_lock_time timestamptz;
  v_signup_id uuid;
begin
  -- 1. Verify the student belongs to the calling user
  select family_account_id, registration_complete
  into v_family_id, v_reg_complete
  from students where id = p_student_id;

  if v_family_id is null or v_family_id != auth.uid() then
    raise exception 'Access denied: student does not belong to your account.';
  end if;

  -- 2. Verify registration is complete
  if v_reg_complete is not true then
    raise exception 'Registration must be complete before signing up for dance.';
  end if;

  -- 3. Verify the dance session exists and get its date + capacity.
  -- Lock the row to serialize concurrent capacity checks and writes.
  select audition_date, capacity
  into v_audition_date, v_capacity
  from dance_sessions where id = p_dance_session_id
  for update;

  if v_audition_date is null then
    raise exception 'Dance session not found.';
  end if;

  -- 4. Check lock time: 2:00 PM on audition day
  v_lock_time := (v_audition_date || ' 14:00:00')::timestamptz;
  if now() >= v_lock_time then
    raise exception 'Sign-up changes are locked after 2:00 PM on the audition day.';
  end if;

  -- 5. Check capacity if set (exclude current student from count for upsert)
  if v_capacity is not null then
    select count(*) into v_current_count
    from dance_signups
    where dance_session_id = p_dance_session_id
      and student_id != p_student_id;

    if v_current_count >= v_capacity then
      raise exception 'This dance session is full.';
    end if;
  end if;

  -- 6. Upsert: insert or update existing sign-up
  insert into dance_signups (student_id, dance_session_id, created_by_user_id, updated_by_user_id)
  values (p_student_id, p_dance_session_id, auth.uid(), auth.uid())
  on conflict (student_id)
  do update set
    dance_session_id = excluded.dance_session_id,
    updated_by_user_id = excluded.updated_by_user_id,
    updated_at = now()
  returning id into v_signup_id;

  return v_signup_id;
end;
$$;

-- ============================================================
-- RPC: delete_dance_signup (family cancellation)
-- ============================================================

create or replace function public.delete_dance_signup(
  p_student_id uuid
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_family_id uuid;
  v_audition_date date;
  v_lock_time timestamptz;
begin
  -- 1. Verify ownership
  select family_account_id into v_family_id
  from students where id = p_student_id;

  if v_family_id is null or v_family_id != auth.uid() then
    raise exception 'Access denied.';
  end if;

  -- 2. Get the audition date from the current sign-up
  select ds.audition_date into v_audition_date
  from dance_signups dsn
  join dance_sessions ds on ds.id = dsn.dance_session_id
  where dsn.student_id = p_student_id;

  if v_audition_date is null then
    raise exception 'No dance sign-up found for this student.';
  end if;

  -- 3. Check lock time
  v_lock_time := (v_audition_date || ' 14:00:00')::timestamptz;
  if now() >= v_lock_time then
    raise exception 'Changes are locked after 2:00 PM on the audition day.';
  end if;

  -- 4. Delete
  delete from dance_signups where student_id = p_student_id;
end;
$$;

-- ============================================================
-- RPC: admin_update_dance_signup (admin override — no lock check)
-- ============================================================

create or replace function public.admin_update_dance_signup(
  p_student_id uuid,
  p_dance_session_id uuid
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_admin boolean;
  v_signup_id uuid;
begin
  -- 1. Verify caller is admin
  select exists(
    select 1 from staff_profiles
    where id = auth.uid() and role = 'admin'
  ) into v_is_admin;

  if not v_is_admin then
    raise exception 'Only admins can override dance sign-ups.';
  end if;

  -- 2. Verify student exists
  if not exists(select 1 from students where id = p_student_id) then
    raise exception 'Student not found.';
  end if;

  -- 3. Verify dance session exists
  if not exists(select 1 from dance_sessions where id = p_dance_session_id) then
    raise exception 'Dance session not found.';
  end if;

  -- 4. Upsert (no lock time check, no registration check)
  insert into dance_signups (student_id, dance_session_id, created_by_user_id, updated_by_user_id)
  values (p_student_id, p_dance_session_id, auth.uid(), auth.uid())
  on conflict (student_id)
  do update set
    dance_session_id = excluded.dance_session_id,
    updated_by_user_id = auth.uid(),
    updated_at = now()
  returning id into v_signup_id;

  return v_signup_id;
end;
$$;
