CREATE TABLE todo_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES todo_tasks(id) ON DELETE CASCADE NOT NULL,
  from_user UUID REFERENCES profiles(id) NOT NULL,
  to_user UUID REFERENCES profiles(id) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  decline_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ
);

ALTER TABLE todo_assignments ENABLE ROW LEVEL SECURITY;
