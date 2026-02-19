CREATE TABLE todo_updates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES todo_tasks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  content TEXT,
  update_type TEXT NOT NULL DEFAULT 'note' CHECK (update_type IN ('note', 'status_change', 'priority_change', 'claimed', 'assigned', 'accepted', 'declined')),
  old_value TEXT,
  new_value TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE todo_updates ENABLE ROW LEVEL SECURITY;
