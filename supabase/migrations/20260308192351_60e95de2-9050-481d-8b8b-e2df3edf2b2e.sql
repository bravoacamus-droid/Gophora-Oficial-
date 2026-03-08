CREATE POLICY "Project owners can update applications"
ON public.mission_applications
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM missions m
    JOIN projects p ON p.id = m.project_id
    WHERE m.id = mission_applications.mission_id
    AND p.user_id = auth.uid()
  )
);