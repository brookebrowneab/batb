-- Feature: Vocal day assignment mode + audition roles + student role preferences.
--
-- New tables:
--   audition_settings — singleton row for season-level config (vocal_mode)
--   audition_roles — admin-managed roles (free text)
--   student_role_preferences — students rank roles during registration
--   vocal_day_assignments — staff assign students to audition dates
--
-- New RPCs:
--   assign_vocal_day — staff assigns a student to an audition date
--   unassign_vocal_day — staff removes a student's day assignment

-- ============================================================
-- Table: audition_settings (singleton row)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.audition_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vocal_mode text NOT NULL DEFAULT 'timeslot'
    CHECK (vocal_mode IN ('timeslot', 'day_assignment')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by_staff_user_id uuid REFERENCES auth.users(id)
);

ALTER TABLE public.audition_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read audition settings"
  ON public.audition_settings FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Staff can create audition settings"
  ON public.audition_settings FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.staff_profiles WHERE id = auth.uid())
  );

CREATE POLICY "Staff can update audition settings"
  ON public.audition_settings FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.staff_profiles WHERE id = auth.uid())
  );

-- Seed default row
INSERT INTO public.audition_settings (vocal_mode) VALUES ('timeslot');

-- ============================================================
-- Table: audition_roles
-- ============================================================

CREATE TABLE IF NOT EXISTS public.audition_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by_staff_user_id uuid REFERENCES auth.users(id),
  updated_by_staff_user_id uuid REFERENCES auth.users(id)
);

CREATE UNIQUE INDEX audition_roles_name_idx ON public.audition_roles(name);

ALTER TABLE public.audition_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read audition roles"
  ON public.audition_roles FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Staff can create audition roles"
  ON public.audition_roles FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.staff_profiles WHERE id = auth.uid())
  );

CREATE POLICY "Staff can update audition roles"
  ON public.audition_roles FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.staff_profiles WHERE id = auth.uid())
  );

CREATE POLICY "Admins can delete audition roles"
  ON public.audition_roles FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.staff_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- Table: student_role_preferences
-- ============================================================

CREATE TABLE IF NOT EXISTS public.student_role_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  audition_role_id uuid NOT NULL REFERENCES public.audition_roles(id) ON DELETE CASCADE,
  rank_order integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by_user_id uuid REFERENCES auth.users(id),
  updated_by_user_id uuid REFERENCES auth.users(id)
);

CREATE UNIQUE INDEX student_role_prefs_student_role_idx
  ON public.student_role_preferences(student_id, audition_role_id);

CREATE UNIQUE INDEX student_role_prefs_student_rank_idx
  ON public.student_role_preferences(student_id, rank_order);

ALTER TABLE public.student_role_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Families can read own role preferences"
  ON public.student_role_preferences FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE students.id = student_role_preferences.student_id
        AND students.family_account_id = auth.uid()
    )
  );

CREATE POLICY "Families can create own role preferences"
  ON public.student_role_preferences FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE students.id = student_role_preferences.student_id
        AND students.family_account_id = auth.uid()
    )
  );

CREATE POLICY "Families can update own role preferences"
  ON public.student_role_preferences FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE students.id = student_role_preferences.student_id
        AND students.family_account_id = auth.uid()
    )
  );

CREATE POLICY "Families can delete own role preferences"
  ON public.student_role_preferences FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE students.id = student_role_preferences.student_id
        AND students.family_account_id = auth.uid()
    )
  );

CREATE POLICY "Staff can read all role preferences"
  ON public.student_role_preferences FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.staff_profiles WHERE id = auth.uid())
  );

-- ============================================================
-- Table: vocal_day_assignments
-- ============================================================

CREATE TABLE IF NOT EXISTS public.vocal_day_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  audition_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  assigned_by_staff_user_id uuid NOT NULL REFERENCES auth.users(id)
);

CREATE UNIQUE INDEX vocal_day_assignments_student_idx
  ON public.vocal_day_assignments(student_id);

ALTER TABLE public.vocal_day_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Families can read own vocal day assignment"
  ON public.vocal_day_assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE students.id = vocal_day_assignments.student_id
        AND students.family_account_id = auth.uid()
    )
  );

CREATE POLICY "Staff can read all vocal day assignments"
  ON public.vocal_day_assignments FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.staff_profiles WHERE id = auth.uid())
  );

-- No direct INSERT/UPDATE/DELETE for families or staff.
-- Mutations go through SECURITY DEFINER RPCs below.

-- ============================================================
-- RPC: assign_vocal_day (staff use)
-- ============================================================

CREATE OR REPLACE FUNCTION public.assign_vocal_day(
  p_student_id uuid,
  p_audition_date date
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_staff boolean;
  v_assignment_id uuid;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM staff_profiles WHERE id = auth.uid()
  ) INTO v_is_staff;

  IF NOT v_is_staff THEN
    RAISE EXCEPTION 'Only staff can assign vocal audition days.';
  END IF;

  IF NOT EXISTS(SELECT 1 FROM students WHERE id = p_student_id) THEN
    RAISE EXCEPTION 'Student not found.';
  END IF;

  IF NOT EXISTS(
    SELECT 1 FROM audition_window_config WHERE audition_date = p_audition_date
  ) THEN
    RAISE EXCEPTION 'Audition date not found in scheduling config.';
  END IF;

  INSERT INTO vocal_day_assignments (student_id, audition_date, assigned_by_staff_user_id)
  VALUES (p_student_id, p_audition_date, auth.uid())
  ON CONFLICT (student_id)
  DO UPDATE SET
    audition_date = EXCLUDED.audition_date,
    assigned_by_staff_user_id = auth.uid(),
    updated_at = now()
  RETURNING id INTO v_assignment_id;

  PERFORM log_admin_audit(
    'assign_vocal_day', auth.uid(), 'vocal_day_assignments', v_assignment_id,
    jsonb_build_object('student_id', p_student_id, 'audition_date', p_audition_date::text)
  );

  RETURN v_assignment_id;
END;
$$;

-- ============================================================
-- RPC: unassign_vocal_day (staff use)
-- ============================================================

CREATE OR REPLACE FUNCTION public.unassign_vocal_day(
  p_student_id uuid
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_staff boolean;
  v_old_date date;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM staff_profiles WHERE id = auth.uid()
  ) INTO v_is_staff;

  IF NOT v_is_staff THEN
    RAISE EXCEPTION 'Only staff can manage vocal day assignments.';
  END IF;

  SELECT audition_date INTO v_old_date
  FROM vocal_day_assignments WHERE student_id = p_student_id;

  IF v_old_date IS NULL THEN
    RAISE EXCEPTION 'No vocal day assignment found for this student.';
  END IF;

  DELETE FROM vocal_day_assignments WHERE student_id = p_student_id;

  PERFORM log_admin_audit(
    'unassign_vocal_day', auth.uid(), 'vocal_day_assignments', NULL,
    jsonb_build_object('student_id', p_student_id, 'removed_date', v_old_date::text)
  );
END;
$$;
