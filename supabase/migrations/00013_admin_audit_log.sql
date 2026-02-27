-- Milestone 10: Admin audit log table + updated RPCs with audit logging.
--
-- Centralized audit trail for all admin/staff override actions.
-- Append-only: no UPDATE/DELETE policies. Inserts via SECURITY DEFINER only.

-- ============================================================
-- Table: admin_audit_log
-- ============================================================

create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  actor_id uuid not null references auth.users(id),
  table_name text not null,
  record_id uuid,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index admin_audit_log_actor_idx
  on public.admin_audit_log(actor_id);

create index admin_audit_log_table_record_idx
  on public.admin_audit_log(table_name, record_id);

create index admin_audit_log_created_idx
  on public.admin_audit_log(created_at desc);

alter table public.admin_audit_log enable row level security;

-- Staff can read all audit log entries
create policy "Staff can read audit log"
  on public.admin_audit_log for select
  using (
    exists (
      select 1 from public.staff_profiles
      where id = auth.uid()
    )
  );

-- No INSERT/UPDATE/DELETE policies.
-- All inserts happen via the SECURITY DEFINER log_admin_audit function.

-- ============================================================
-- RPC: log_admin_audit (SECURITY DEFINER — called from within other RPCs)
-- ============================================================

create or replace function public.log_admin_audit(
  p_action text,
  p_actor_id uuid,
  p_table_name text,
  p_record_id uuid,
  p_details jsonb default '{}'::jsonb
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_staff boolean;
  v_actor_id uuid;
  v_log_id uuid;
begin
  -- Only authenticated staff can write audit entries.
  select auth.uid() into v_actor_id;
  if v_actor_id is null then
    raise exception 'Authentication required.';
  end if;

  select exists(
    select 1 from staff_profiles where id = v_actor_id
  ) into v_is_staff;
  if not v_is_staff then
    raise exception 'Only staff can write audit logs.';
  end if;

  -- Never trust client-supplied actor IDs.
  if p_actor_id is distinct from v_actor_id then
    raise exception 'actor_id must match auth.uid().';
  end if;

  insert into admin_audit_log (action, actor_id, table_name, record_id, details)
  values (p_action, v_actor_id, p_table_name, p_record_id, p_details)
  returning id into v_log_id;
  return v_log_id;
end;
$$;

-- ============================================================
-- Updated RPC: admin_update_dance_signup (now with audit logging)
-- Same signature as 00008; CREATE OR REPLACE is safe.
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

  -- 5. Audit log
  perform log_admin_audit(
    'admin_override_dance_signup', auth.uid(), 'dance_signups', v_signup_id,
    jsonb_build_object('student_id', p_student_id, 'dance_session_id', p_dance_session_id)
  );

  return v_signup_id;
end;
$$;

-- ============================================================
-- Updated RPC: admin_override_vocal_booking (now with audit logging)
-- Same signature as 00009; CREATE OR REPLACE is safe.
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

  -- 5. Audit log
  perform log_admin_audit(
    'admin_override_vocal_booking', auth.uid(), 'vocal_bookings', v_booking_id,
    jsonb_build_object('student_id', p_student_id, 'slot_id', p_slot_id)
  );

  return v_booking_id;
end;
$$;

-- ============================================================
-- Updated RPC: toggle_callback_invite (now with audit logging)
-- Same signature as 00010; CREATE OR REPLACE is safe.
-- ============================================================

create or replace function public.toggle_callback_invite(
  p_student_id uuid,
  p_invited boolean
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_staff boolean;
begin
  -- 1. Verify caller is staff (director or admin)
  select exists(
    select 1 from staff_profiles
    where id = auth.uid()
  ) into v_is_staff;

  if not v_is_staff then
    raise exception 'Only staff can update callback invitations.';
  end if;

  -- 2. Verify student exists
  if not exists(select 1 from students where id = p_student_id) then
    raise exception 'Student not found.';
  end if;

  -- 3. Update the callback_invited flag + audit fields
  update students
  set callback_invited = p_invited,
      updated_by_user_id = auth.uid(),
      updated_at = now()
  where id = p_student_id;

  -- 4. Audit log
  perform log_admin_audit(
    'toggle_callback_invite', auth.uid(), 'students', p_student_id,
    jsonb_build_object('invited', p_invited)
  );
end;
$$;

-- ============================================================
-- New RPC: activate_contract (atomic deactivate-all + activate-one + audit)
-- Replaces the two-step client-side approach for atomicity + audit logging.
-- ============================================================

create or replace function public.activate_contract(
  p_contract_id uuid
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_admin boolean;
  v_old_active_id uuid;
begin
  -- 1. Verify caller is admin
  select exists(
    select 1 from staff_profiles
    where id = auth.uid() and role = 'admin'
  ) into v_is_admin;

  if not v_is_admin then
    raise exception 'Only admins can activate contracts.';
  end if;

  -- 2. Verify target contract exists
  if not exists(select 1 from contracts where id = p_contract_id) then
    raise exception 'Contract not found.';
  end if;

  -- 3. Find currently active contract (for audit)
  select id into v_old_active_id
  from contracts where is_active = true;

  -- 4. Deactivate all
  update contracts set is_active = false where is_active = true;

  -- 5. Activate target
  update contracts set is_active = true where id = p_contract_id;

  -- 6. Audit log
  perform log_admin_audit(
    'activate_contract', auth.uid(), 'contracts', p_contract_id,
    jsonb_build_object('previous_active_id', v_old_active_id)
  );
end;
$$;
