-- Storage policies for the course-thumbnails bucket.
-- Without these, tutors cannot upload course thumbnails even though the
-- bucket is public for read — INSERT was previously denied by default RLS.
--
-- Each user's uploads must live under a folder named after their auth.uid(),
-- e.g. "<uid>/my-course.png", so they can only manage their own files.

CREATE POLICY "Public can view course thumbnails"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'course-thumbnails');

CREATE POLICY "Authenticated users can upload course thumbnails"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'course-thumbnails'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update their own course thumbnails"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'course-thumbnails'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own course thumbnails"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'course-thumbnails'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
