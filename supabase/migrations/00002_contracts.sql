-- Milestone 2: Contracts table — versioned, immutable snapshots.
--
-- Only one contract may be active at any time.
-- Contract text_snapshot must not be edited after creation; create a new version instead.

create table if not exists public.contracts (
  id uuid primary key default gen_random_uuid(),
  version_number integer not null,
  text_snapshot text not null,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  created_by_staff_user_id uuid not null references auth.users(id)
);

-- Enforce monotonic version numbers
create unique index contracts_version_number_idx on public.contracts(version_number);

-- Enforce at most one active contract (partial unique index)
create unique index contracts_one_active_idx on public.contracts(is_active) where (is_active = true);

-- RLS
alter table public.contracts enable row level security;

-- Anyone authenticated can read contracts (families need to see active contract text)
create policy "Authenticated users can read contracts"
  on public.contracts for select
  using (auth.uid() is not null);

-- Only admins can insert contracts
create policy "Admins can create contracts"
  on public.contracts for insert
  with check (
    exists (
      select 1 from public.staff_profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Only admins can update contracts (to set is_active)
create policy "Admins can update contracts"
  on public.contracts for update
  using (
    exists (
      select 1 from public.staff_profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- No delete policy — contracts are never deleted
