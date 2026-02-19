CREATE OR REPLACE FUNCTION update_todo_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER todo_tasks_updated_at
  BEFORE UPDATE ON todo_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_todo_tasks_updated_at();
