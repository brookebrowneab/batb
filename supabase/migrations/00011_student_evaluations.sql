-- Milestone 8: Student evaluations table for staff notes.
--
-- Staff can add evaluation notes per student per track.
-- Each staff member can only edit their own notes.
-- Admin can delete any evaluation.
-- Families have no access to evaluations.

-- ============================================================
-- Table: student_evaluations
-- ============================================================

create table if not exists public.student_evaluations (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  staff_user_id uuid not null references auth.users(id),
  track text not null check (track in ('dance', 'vocal', 'callbacks', 'general')),
  notes text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.student_evaluations enable row level security;

-- Staff can read all evaluations
create policy "Staff can read all evaluations"
  on public.student_evaluations for select
  using (
    exists (
      select 1 from public.staff_profiles
      where id = auth.uid()
    )
  );

-- Staff can insert evaluations (must set own staff_user_id)
create policy "Staff can insert own evaluations"
  on public.student_evaluations for insert
  with check (
    staff_user_id = auth.uid()
    and exists (
      select 1 from public.staff_profiles
      where id = auth.uid()
    )
  );

-- Staff can update only their own evaluations
create policy "Staff can update own evaluations"
  on public.student_evaluations for update
  using (
    staff_user_id = auth.uid()
    and exists (
      select 1 from public.staff_profiles
      where id = auth.uid()
    )
  )
  with check (
    staff_user_id = auth.uid()
  );

-- Admin can delete any evaluation
create policy "Admin can delete evaluations"
  on public.student_evaluations for delete
  using (
    exists (
      select 1 from public.staff_profiles
      where id = auth.uid()
      and role = 'admin'
    )
  );

-- Index for efficient lookups by student
create index student_evaluations_student_idx
  on public.student_evaluations(student_id);

-- Index for efficient lookups by staff author
create index student_evaluations_staff_idx
  on public.student_evaluations(staff_user_id);
