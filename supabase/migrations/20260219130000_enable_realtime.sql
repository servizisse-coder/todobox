-- Enable realtime for todo_notifications
ALTER PUBLICATION supabase_realtime ADD TABLE todo_notifications;

-- Also enable for todo_tasks so task list updates in real-time
ALTER PUBLICATION supabase_realtime ADD TABLE todo_tasks;
