-- Milestone 2: Contract acceptances — immutable records tied to contract versions.
--
-- One acceptance per (student_id, contract_id). History preserved forever.
-- Both student and parent typed signatures required.

create table if not exists public.contract_acceptances (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  contract_id uuid not null references public.contracts(id),
  student_typed_signature text not null,
  student_signed_at timestamptz not null default now(),
  parent_typed_signature text not null,
  parent_signed_at timestamptz not null default now(),
  signed_by_user_id uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

-- One acceptance per student per contract version
create unique index contract_acceptances_student_contract_idx
  on public.contract_acceptances(student_id, contract_id);

-- RLS
alter table public.contract_acceptances enable row level security;

-- Families can read acceptances for their own students
create policy "Families can read own acceptances"
  on public.contract_acceptances for select
  using (
    exists (
      select 1 from public.students
      where students.id = contract_acceptances.student_id
        and students.family_account_id = auth.uid()
    )
  );

-- Families can create acceptances for their own students
create policy "Families can create own acceptances"
  on public.contract_acceptances for insert
  with check (
    signed_by_user_id = auth.uid()
    and exists (
      select 1 from public.students
      where students.id = contract_acceptances.student_id
        and students.family_account_id = auth.uid()
    )
  );

-- Staff can read all acceptances (for admin acceptance history view)
create policy "Staff can read all acceptances"
  on public.contract_acceptances for select
  using (
    exists (
      select 1 from public.staff_profiles
      where id = auth.uid()
    )
  );

-- No update or delete policies — acceptances are immutable
