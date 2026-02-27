-- Milestone 7: Callback invite toggle RPC + notification audit table.
--
-- Callbacks are invite-only: no booking/sign-up records.
-- Staff toggle callback_invited via RPC (directors can't UPDATE students via RLS).
-- Notification sends are logged in an append-only audit table.

-- ============================================================
-- RPC: toggle_callback_invite (staff use — directors + admins)
-- Directors cannot update students table directly (RLS blocks it).
-- This RPC uses SECURITY DEFINER to bypass that restriction.
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
end;
$$;

-- ============================================================
-- Table: notification_sends (append-only audit log)
-- ============================================================

create table if not exists public.notification_sends (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  notification_type text not null default 'callback_invite',
  sent_by_user_id uuid not null references auth.users(id),
  recipient_email text not null,
  subject text not null,
  body_preview text,
  status text not null default 'sent',
  created_at timestamptz not null default now()
);

alter table public.notification_sends enable row level security;

-- Staff can read all notification sends (for audit trail)
create policy "Staff can read all notification sends"
  on public.notification_sends for select
  using (
    exists (
      select 1 from public.staff_profiles
      where id = auth.uid()
    )
  );

-- Staff can insert notification sends (log new sends)
create policy "Staff can insert notification sends"
  on public.notification_sends for insert
  with check (
    exists (
      select 1 from public.staff_profiles
      where id = auth.uid()
    )
  );

-- No UPDATE or DELETE policies — notification log is append-only.
-- Families cannot read notification sends (staff-only audit).

-- ============================================================
-- RPC: log_notification_send (staff audit logging)
-- ============================================================

create or replace function public.log_notification_send(
  p_student_id uuid,
  p_recipient_email text,
  p_subject text,
  p_body_preview text
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_staff boolean;
  v_send_id uuid;
begin
  -- 1. Verify caller is staff
  select exists(
    select 1 from staff_profiles
    where id = auth.uid()
  ) into v_is_staff;

  if not v_is_staff then
    raise exception 'Only staff can log notification sends.';
  end if;

  -- 2. Verify student exists
  if not exists(select 1 from students where id = p_student_id) then
    raise exception 'Student not found.';
  end if;

  -- 3. Insert log entry
  insert into notification_sends (
    student_id, notification_type, sent_by_user_id,
    recipient_email, subject, body_preview, status
  ) values (
    p_student_id, 'callback_invite', auth.uid(),
    p_recipient_email, p_subject, p_body_preview, 'sent'
  )
  returning id into v_send_id;

  return v_send_id;
end;
$$;
