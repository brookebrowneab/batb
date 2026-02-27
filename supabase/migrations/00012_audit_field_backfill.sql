-- Milestone 10: Backfill missing audit fields on three tables.
-- All columns nullable so existing rows are unaffected.

-- audition_window_config: add created_by_staff_user_id
alter table public.audition_window_config
  add column if not exists created_by_staff_user_id uuid references auth.users(id);

-- dance_sessions: add updated_by_staff_user_id
alter table public.dance_sessions
  add column if not exists updated_by_staff_user_id uuid references auth.users(id);

-- audition_slots: add updated_by_staff_user_id
alter table public.audition_slots
  add column if not exists updated_by_staff_user_id uuid references auth.users(id);
