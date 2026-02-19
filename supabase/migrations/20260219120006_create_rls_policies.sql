-- todo_tasks policies
CREATE POLICY "Users can view own tasks" ON todo_tasks FOR SELECT
  USING (created_by = auth.uid());

CREATE POLICY "Users can view tasks assigned to them" ON todo_tasks FOR SELECT
  USING (assigned_to = auth.uid());

CREATE POLICY "Users can view tasks they assigned" ON todo_tasks FOR SELECT
  USING (assigned_by = auth.uid());

CREATE POLICY "Users can view tasks they claimed" ON todo_tasks FOR SELECT
  USING (claimed_by = auth.uid());

CREATE POLICY "Users can view public tasks" ON todo_tasks FOR SELECT
  USING (visibility = 'public');

CREATE POLICY "Authenticated users can create tasks" ON todo_tasks FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Task owners can update" ON todo_tasks FOR UPDATE
  USING (created_by = auth.uid() OR assigned_to = auth.uid() OR claimed_by = auth.uid());

CREATE POLICY "Task owners can delete" ON todo_tasks FOR DELETE
  USING (created_by = auth.uid());

-- todo_assignments policies
CREATE POLICY "Users can view own assignments" ON todo_assignments FOR SELECT
  USING (from_user = auth.uid() OR to_user = auth.uid());

CREATE POLICY "Authenticated users can create assignments" ON todo_assignments FOR INSERT
  WITH CHECK (from_user = auth.uid());

CREATE POLICY "Recipients can update assignments" ON todo_assignments FOR UPDATE
  USING (to_user = auth.uid());

-- todo_updates policies
CREATE POLICY "Users can view updates for accessible tasks" ON todo_updates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM todo_tasks t
      WHERE t.id = todo_updates.task_id
      AND (t.created_by = auth.uid() OR t.assigned_to = auth.uid() OR t.assigned_by = auth.uid() OR t.claimed_by = auth.uid())
    )
  );

CREATE POLICY "Users can create updates for accessible tasks" ON todo_updates FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM todo_tasks t
      WHERE t.id = todo_updates.task_id
      AND (t.created_by = auth.uid() OR t.assigned_to = auth.uid() OR t.assigned_by = auth.uid() OR t.claimed_by = auth.uid())
    )
  );

-- todo_notifications policies
CREATE POLICY "Users can view own notifications" ON todo_notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON todo_notifications FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Authenticated users can create notifications" ON todo_notifications FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');
