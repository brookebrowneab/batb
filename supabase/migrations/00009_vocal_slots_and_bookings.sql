-- Milestone 6: Vocal audition slots and bookings.
--
-- audition_slots: 15-minute blocks generated from vocal window config.
-- vocal_bookings: exactly one per student, mutations via RPCs only.
-- Capacity hard cap: 7 per slot, enforced transactionally with SELECT FOR UPDATE.

-- ============================================================
-- Table: audition_slots
-- ============================================================

create table if not exists public.audition_slots (
  id uuid primary key default gen_random_uuid(),
  audition_date date not null,
  start_time time not null,
  end_time time not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by_staff_user_id uuid references auth.users(id)
);

-- One slot per date+start_time
create unique index audition_slots_date_time_idx
  on public.audition_slots(audition_date, start_time);

alter table public.audition_slots enable row level security;

-- All authenticated users can read slots (families need to see availability)
create policy "Authenticated users can read audition slots"
  on public.audition_slots for select
  using (auth.uid() is not null);

-- Staff can create slots
create policy "Staff can create audition slots"
  on public.audition_slots for insert
  with check (
    exists (
      select 1 from public.staff_profiles
      where id = auth.uid()
    )
  );

-- Staff can update slots
create policy "Staff can update audition slots"
  on public.audition_slots for update
  using (
    exists (
      select 1 from public.staff_profiles
      where id = auth.uid()
    )
  );

-- Only admins can delete slots
create policy "Admins can delete audition slots"
  on public.audition_slots for delete
  using (
    exists (
      select 1 from public.staff_profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ============================================================
-- Table: vocal_bookings
-- ============================================================

create table if not exists public.vocal_bookings (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  audition_slot_id uuid not null references public.audition_slots(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by_user_id uuid references auth.users(id),
  updated_by_user_id uuid references auth.users(id)
);

-- Exactly one vocal booking per student
create unique index vocal_bookings_student_idx
  on public.vocal_bookings(student_id);

alter table public.vocal_bookings enable row level security;

-- Families can read their own student's bookings
create policy "Families can read own vocal bookings"
  on public.vocal_bookings for select
  using (
    exists (
      select 1 from public.students
      where students.id = vocal_bookings.student_id
        and students.family_account_id = auth.uid()
    )
  );

-- Staff can read all bookings (for roster)
create policy "Staff can read all vocal bookings"
  on public.vocal_bookings for select
  using (
    exists (
      select 1 from public.staff_profiles
      where id = auth.uid()
    )
  );

-- No direct INSERT/UPDATE/DELETE policies for families.
-- All mutations go through SECURITY DEFINER RPCs below.

-- ============================================================
-- RPC: book_vocal_slot (family use — new booking only)
-- Uses SELECT FOR UPDATE to serialize concurrent access to the slot.
-- ============================================================

create or replace function public.book_vocal_slot(
  p_student_id uuid,
  p_slot_id uuid
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_family_id uuid;
  v_reg_complete boolean;
  v_audition_date date;
  v_lock_time timestamptz;
  v_current_count integer;
  v_existing_booking uuid;
  v_booking_id uuid;
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
    raise exception 'Registration must be complete before booking a vocal slot.';
  end if;

  -- 3. Lock the slot row and get its date (SELECT FOR UPDATE serializes concurrent bookings)
  select audition_date into v_audition_date
  from audition_slots where id = p_slot_id
  for update;

  if v_audition_date is null then
    raise exception 'Vocal slot not found.';
  end if;

  -- 4. Check lock time: 2:00 PM on audition day
  v_lock_time := (v_audition_date || ' 14:00:00')::timestamptz;
  if now() >= v_lock_time then
    raise exception 'Booking changes are locked after 2:00 PM on the audition day.';
  end if;

  -- 5. Check if student already has a booking (must use reschedule instead)
  select id into v_existing_booking
  from vocal_bookings where student_id = p_student_id;

  if v_existing_booking is not null then
    raise exception 'Student already has a vocal booking. Use reschedule to change slots.';
  end if;

  -- 6. Check capacity (max 7 per slot)
  select count(*) into v_current_count
  from vocal_bookings where audition_slot_id = p_slot_id;

  if v_current_count >= 7 then
    raise exception 'This vocal slot is full (maximum 7 students).';
  end if;

  -- 7. Insert booking
  insert into vocal_bookings (student_id, audition_slot_id, created_by_user_id, updated_by_user_id)
  values (p_student_id, p_slot_id, auth.uid(), auth.uid())
  returning id into v_booking_id;

  return v_booking_id;
end;
$$;

-- ============================================================
-- RPC: reschedule_vocal_slot (atomic move — release old + claim new)
-- ============================================================

create or replace function public.reschedule_vocal_slot(
  p_student_id uuid,
  p_new_slot_id uuid
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_family_id uuid;
  v_reg_complete boolean;
  v_audition_date date;
  v_lock_time timestamptz;
  v_current_count integer;
  v_booking_id uuid;
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
    raise exception 'Registration must be complete.';
  end if;

  -- 3. Verify existing booking exists
  select id into v_booking_id
  from vocal_bookings where student_id = p_student_id;

  if v_booking_id is null then
    raise exception 'No existing vocal booking found. Use book instead of reschedule.';
  end if;

  -- 4. Lock the new slot row and get its date
  select audition_date into v_audition_date
  from audition_slots where id = p_new_slot_id
  for update;

  if v_audition_date is null then
    raise exception 'Vocal slot not found.';
  end if;

  -- 5. Check lock time for the new slot's date
  v_lock_time := (v_audition_date || ' 14:00:00')::timestamptz;
  if now() >= v_lock_time then
    raise exception 'Booking changes are locked after 2:00 PM on the audition day.';
  end if;

  -- 6. Check capacity on new slot (max 7)
  select count(*) into v_current_count
  from vocal_bookings where audition_slot_id = p_new_slot_id;

  if v_current_count >= 7 then
    raise exception 'This vocal slot is full (maximum 7 students).';
  end if;

  -- 7. Atomic move: update existing booking to new slot
  update vocal_bookings
  set audition_slot_id = p_new_slot_id,
      updated_by_user_id = auth.uid(),
      updated_at = now()
  where student_id = p_student_id;

  return v_booking_id;
end;
$$;

-- ============================================================
-- RPC: cancel_vocal_booking (family cancellation)
-- ============================================================

create or replace function public.cancel_vocal_booking(
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

  -- 2. Get the audition date from the current booking
  select s.audition_date into v_audition_date
  from vocal_bookings vb
  join audition_slots s on s.id = vb.audition_slot_id
  where vb.student_id = p_student_id;

  if v_audition_date is null then
    raise exception 'No vocal booking found for this student.';
  end if;

  -- 3. Check lock time
  v_lock_time := (v_audition_date || ' 14:00:00')::timestamptz;
  if now() >= v_lock_time then
    raise exception 'Changes are locked after 2:00 PM on the audition day.';
  end if;

  -- 4. Delete
  delete from vocal_bookings where student_id = p_student_id;
end;
$$;

-- ============================================================
-- RPC: admin_override_vocal_booking (admin — no lock/capacity check)
-- ============================================================

create or replace function public.admin_override_vocal_booking(
  p_student_id uuid,
  p_slot_id uuid
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_admin boolean;
  v_booking_id uuid;
begin
  -- 1. Verify caller is admin
  select exists(
    select 1 from staff_profiles
    where id = auth.uid() and role = 'admin'
  ) into v_is_admin;

  if not v_is_admin then
    raise exception 'Only admins can override vocal bookings.';
  end if;

  -- 2. Verify student exists
  if not exists(select 1 from students where id = p_student_id) then
    raise exception 'Student not found.';
  end if;

  -- 3. Verify slot exists
  if not exists(select 1 from audition_slots where id = p_slot_id) then
    raise exception 'Vocal slot not found.';
  end if;

  -- 4. Upsert booking (no lock time check, no capacity check)
  insert into vocal_bookings (student_id, audition_slot_id, created_by_user_id, updated_by_user_id)
  values (p_student_id, p_slot_id, auth.uid(), auth.uid())
  on conflict (student_id)
  do update set
    audition_slot_id = excluded.audition_slot_id,
    updated_by_user_id = auth.uid(),
    updated_at = now()
  returning id into v_booking_id;

  return v_booking_id;
end;
$$;
