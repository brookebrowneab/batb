-- Migration 00016: Add new registration fields to students table
-- student_email, parent2 info, audition song details

ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS student_email text,
  ADD COLUMN IF NOT EXISTS parent2_first_name text,
  ADD COLUMN IF NOT EXISTS parent2_last_name text,
  ADD COLUMN IF NOT EXISTS parent2_email text,
  ADD COLUMN IF NOT EXISTS parent2_phone text,
  ADD COLUMN IF NOT EXISTS sings_own_disney_song boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS song_name text;
