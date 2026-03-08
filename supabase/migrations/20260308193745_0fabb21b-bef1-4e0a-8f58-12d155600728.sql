CREATE POLICY "Users can update own applications"
ON public.mission_applications
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);