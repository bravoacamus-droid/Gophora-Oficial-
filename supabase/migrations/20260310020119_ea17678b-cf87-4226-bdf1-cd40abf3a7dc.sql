
CREATE POLICY "Users can delete own progress" ON public.explorer_course_progress FOR DELETE TO authenticated USING (auth.uid() = user_id);
