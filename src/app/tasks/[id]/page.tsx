'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Edit3, Trash2, UserPlus } from 'lucide-react'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { AppShell } from '@/components/layout/AppShell'
import { PriorityBadge } from '@/components/tasks/PriorityBadge'
import { StatusBadge } from '@/components/tasks/StatusBadge'
import { DueDateBadge } from '@/components/tasks/DueDateBadge'
import { RecurringBadge } from '@/components/tasks/RecurringBadge'
import { TaskTimeline } from '@/components/tasks/TaskTimeline'
import { AssignTaskModal } from '@/components/tasks/AssignTaskModal'
import { useTasks } from '@/hooks/useTasks'
import { useTaskUpdates } from '@/hooks/useTaskUpdates'
import { useAssignments } from '@/hooks/useAssignments'
import { useAuth } from '@/components/providers/AuthProvider'
import type { TaskStatus, TodoTask } from '@/types'

export default function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { user } = useAuth()
  const { tasks, loading: tasksLoading, toggleStatus, updatePriority, updateTask, deleteTask } = useTasks()
  const { updates, addNote } = useTaskUpdates(id)
  const { assignTask } = useAssignments()
  const [assignModalOpen, setAssignModalOpen] = useState(false)

  const task = tasks.find(t => t.id === id)

  if (tasksLoading) {
    return (
      <AppShell>
        <div className="text-center py-16">
          <div className="animate-pulse text-sm text-gray-400">Caricamento task...</div>
        </div>
      </AppShell>
    )
  }

  if (!task) {
    return (
      <AppShell>
        <div className="text-center py-16">
          <p className="text-sm text-gray-400">Task non trovato.</p>
          <Link href="/tasks" className="text-sm text-blue-500 hover:text-blue-600 mt-2 inline-block">
            Torna ai task
          </Link>
        </div>
      </AppShell>
    )
  }

  const isOwner = task.created_by === user?.id
  const canEdit = isOwner || task.assigned_to === user?.id || task.claimed_by === user?.id

  const handleStatusChange = async (newStatus: TaskStatus) => {
    if (!task || !user) return
    if (newStatus === 'done' || task.status === 'done') {
      // Usa toggleStatus per gestire notifiche e ricorrenze
      await toggleStatus(task)
    } else {
      // Per transizioni intermedie (todo <-> in_progress), usa updateTask
      await updateTask(task.id, {
        status: newStatus,
      })
      // Crea entry nell'update log
      const supabase = (await import('@/lib/supabase/client')).createClient()
      await supabase.from('todo_updates').insert({
        task_id: task.id,
        user_id: user.id,
        update_type: 'status_change',
        old_value: task.status,
        new_value: newStatus,
      })
    }
  }

  const handleDelete = async () => {
    if (confirm('Sei sicuro di voler eliminare questo task?')) {
      await deleteTask(task.id)
      router.push('/tasks')
    }
  }

  return (
    <AppShell>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/tasks" className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-lg font-bold text-gray-900">Dettaglio Task</h1>
          </div>

          <div className="flex items-center gap-1">
            {isOwner && (
              <>
                <button
                  onClick={() => setAssignModalOpen(true)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                  title="Assegna"
                >
                  <UserPlus className="w-4 h-4 text-gray-500" />
                </button>
                <Link
                  href={`/tasks/new?edit=${task.id}`}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                  title="Modifica"
                >
                  <Edit3 className="w-4 h-4 text-gray-500" />
                </Link>
                <button
                  onClick={handleDelete}
                  className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                  title="Elimina"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Task details */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-gray-900">{task.title}</h2>
              {task.description && (
                <p className="text-sm text-gray-600 mt-1">{task.description}</p>
              )}
            </div>
            <PriorityBadge
              priority={task.priority}
              onClick={canEdit ? (p) => updatePriority(task, p) : undefined}
              size="md"
            />
          </div>

          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={task.status} />
            {task.due_date && <DueDateBadge dueDate={task.due_date} completed={task.status === 'done'} />}
            {task.is_recurring && task.recurrence_type && (
              <RecurringBadge recurrenceType={task.recurrence_type} interval={task.recurrence_interval} />
            )}
          </div>

          {/* Status actions */}
          {canEdit && (
            <div className="flex gap-2">
              {(['todo', 'in_progress', 'done'] as TaskStatus[]).map((s) => (
                <button
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  disabled={task.status === s}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                    task.status === s
                      ? 'bg-blue-50 text-blue-600 border-blue-200'
                      : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {s === 'todo' ? 'Da fare' : s === 'in_progress' ? 'In corso' : 'Completato'}
                </button>
              ))}
            </div>
          )}

          {/* Meta info */}
          <div className="border-t border-gray-100 pt-3 space-y-1">
            {task.creator && (
              <p className="text-xs text-gray-400">Creato da {task.creator.full_name}</p>
            )}
            {task.assigner && (
              <p className="text-xs text-gray-400">Assegnato da {task.assigner.full_name}</p>
            )}
            {task.assignee && (
              <p className="text-xs text-gray-400">Assegnato a {task.assignee.full_name}</p>
            )}
            {task.claimer && (
              <p className="text-xs text-gray-400">Preso in carico da {task.claimer.full_name}</p>
            )}
            <p className="text-xs text-gray-400">
              Creato il {format(new Date(task.created_at), 'd MMMM yyyy, HH:mm', { locale: it })}
            </p>
            {task.completed_at && (
              <p className="text-xs text-gray-400">
                Completato il {format(new Date(task.completed_at), 'd MMMM yyyy, HH:mm', { locale: it })}
              </p>
            )}
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <TaskTimeline updates={updates} onAddNote={addNote} />
        </div>
      </div>

      <AssignTaskModal
        taskId={task.id}
        open={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        onAssign={assignTask}
      />
    </AppShell>
  )
}
