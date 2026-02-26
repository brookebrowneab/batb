-- Milestone 3: Storage policies for private student-photos bucket.
--
-- Photos are stored under {family_auth_uid}/{uuid}.ext
-- Families can only access photos in their own folder.
-- Staff can read all photos for rosters/packs.

-- Bucket was created via: INSERT INTO storage.buckets (id, name, public) VALUES ('student-photos', 'student-photos', false);

-- Families can upload photos to their own folder (folder = auth.uid())
CREATE POLICY "Families can upload own photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'student-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Families can read their own photos
CREATE POLICY "Families can read own photos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'student-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Families can update/replace their own photos
CREATE POLICY "Families can update own photos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'student-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Staff can read all photos (for rosters/packs)
CREATE POLICY "Staff can read all photos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'student-photos'
    AND EXISTS (
      SELECT 1 FROM public.staff_profiles
      WHERE id = auth.uid()
    )
  );
