-- Milestone 3: Add parent/guardian fields to students table for registration.

ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS parent_first_name text,
  ADD COLUMN IF NOT EXISTS parent_last_name text,
  ADD COLUMN IF NOT EXISTS parent_email text,
  ADD COLUMN IF NOT EXISTS parent_phone text;
