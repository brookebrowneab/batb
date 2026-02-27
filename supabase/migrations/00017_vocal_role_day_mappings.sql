-- Vocal role-day mappings for day-assignment mode.
-- Directors/admins assign each role to an audition date,
-- then students can be auto-assigned by their #1 role preference.

CREATE TABLE IF NOT EXISTS public.vocal_role_day_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audition_role_id uuid NOT NULL REFERENCES public.audition_roles(id) ON DELETE CASCADE,
  audition_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by_staff_user_id uuid NOT NULL REFERENCES auth.users(id),
  updated_by_staff_user_id uuid NOT NULL REFERENCES auth.users(id),
  CONSTRAINT vocal_role_day_mappings_unique_role UNIQUE (audition_role_id)
);

ALTER TABLE public.vocal_role_day_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can read role day mappings"
  ON public.vocal_role_day_mappings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.staff_profiles sp
      WHERE sp.id = auth.uid()
    )
  );

CREATE POLICY "Staff can insert role day mappings"
  ON public.vocal_role_day_mappings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.staff_profiles sp
      WHERE sp.id = auth.uid()
    )
    AND created_by_staff_user_id = auth.uid()
    AND updated_by_staff_user_id = auth.uid()
  );

CREATE POLICY "Staff can update role day mappings"
  ON public.vocal_role_day_mappings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.staff_profiles sp
      WHERE sp.id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.staff_profiles sp
      WHERE sp.id = auth.uid()
    )
    AND updated_by_staff_user_id = auth.uid()
  );

CREATE POLICY "Staff can delete role day mappings"
  ON public.vocal_role_day_mappings FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.staff_profiles sp
      WHERE sp.id = auth.uid()
    )
  );
