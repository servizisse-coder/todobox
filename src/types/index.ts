export interface Profile {
  id: string
  email: string
  full_name: string
  department: string | null
  avatar_url: string | null
  is_admin: boolean
  is_direction?: boolean
  created_at: string
  updated_at: string
}

export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'cancelled'
export type TaskPriority = 'high' | 'medium' | 'low'
export type TaskVisibility = 'private' | 'public' | 'assigned'
export type RecurrenceType = 'daily' | 'weekly' | 'monthly' | 'custom'
export type AssignmentStatus = 'pending' | 'accepted' | 'declined'
export type UpdateType = 'note' | 'status_change' | 'priority_change' | 'claimed' | 'assigned' | 'accepted' | 'declined'
export type NotificationType = 'task_assigned' | 'task_accepted' | 'task_declined' | 'task_updated' | 'task_due_today' | 'task_claimed' | 'task_completed'

export interface TodoRole {
  id: string
  user_id: string
  name: string
  color: string
  sort_order: number
  created_at: string
  updated_at: string
}

export interface TodoTask {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  visibility: TaskVisibility
  due_date: string | null
  is_recurring: boolean
  recurrence_type: RecurrenceType | null
  recurrence_interval: number | null
  created_by: string
  assigned_to: string | null
  assigned_by: string | null
  claimed_by: string | null
  claimed_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
  // New fields
  role_id: string | null
  referent: string | null
  company: string | null
  // Joined fields
  creator?: Profile
  assignee?: Profile
  assigner?: Profile
  claimer?: Profile
  role?: TodoRole
}

export interface TodoAssignment {
  id: string
  task_id: string
  from_user: string
  to_user: string
  status: AssignmentStatus
  decline_reason: string | null
  created_at: string
  responded_at: string | null
  // Joined fields
  task?: TodoTask
  sender?: Profile
  recipient?: Profile
}

export interface TodoUpdate {
  id: string
  task_id: string
  user_id: string
  content: string | null
  update_type: UpdateType
  old_value: string | null
  new_value: string | null
  created_at: string
  // Joined fields
  user?: Profile
}

export interface TodoNotification {
  id: string
  user_id: string
  task_id: string | null
  type: NotificationType
  message: string
  is_read: boolean
  created_at: string
  // Joined fields
  task?: TodoTask
}

export interface TaskFilters {
  status: TaskStatus | 'all'
  priority: TaskPriority | 'all'
  type: 'all' | 'personal' | 'assigned_to_me' | 'assigned_by_me' | 'public'
  dueDate: 'all' | 'today' | 'this_week' | 'overdue' | 'no_date'
  role: string | 'all'
  search: string
}
