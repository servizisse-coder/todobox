CREATE TABLE todo_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  task_id UUID REFERENCES todo_tasks(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('task_assigned', 'task_accepted', 'task_declined', 'task_updated', 'task_due_today', 'task_claimed', 'task_completed')),
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE todo_notifications ENABLE ROW LEVEL SECURITY;
