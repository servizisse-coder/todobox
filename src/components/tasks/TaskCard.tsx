'use client'

import { useState } from 'react'
import { MoreHorizontal, Trash2, Edit3, User, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import type { TodoTask, TaskPriority } from '@/types'
import { PriorityBadge } from './PriorityBadge'
import { DueDateBadge } from './DueDateBadge'
import { RecurringBadge } from './RecurringBadge'
import { useAuth } from '@/components/providers/AuthProvider'

interface TaskCardProps {
  task: TodoTask
  onToggle: (task: TodoTask) => void
  onPriorityChange: (task: TodoTask, priority: TaskPriority) => void
  onDelete: (taskId: string) => void
  showAssignment?: boolean
}

export function TaskCard({ task, onToggle, onPriorityChange, onDelete, showAssignment }: TaskCardProps) {
  const { user } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const isDone = task.status === 'done'

  return (
    <div className={`task-card task-enter bg-white border rounded-xl p-3 ${isDone ? 'opacity-60' : ''}`}>
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={() => onToggle(task)}
          className={`
            mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all task-checkbox
            ${isDone
              ? 'border-green-500 bg-green-500 checked'
              : 'border-gray-300 hover:border-blue-400'
            }
          `}
        >
          {isDone && (
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Link
              href={`/tasks/${task.id}`}
              className={`text-sm font-medium truncate hover:text-blue-600 transition-colors ${isDone ? 'line-through text-gray-400' : 'text-gray-900'}`}
            >
              {task.title}
            </Link>
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {task.due_date && (
              <DueDateBadge dueDate={task.due_date} completed={isDone} />
            )}
            {task.is_recurring && task.recurrence_type && (
              <RecurringBadge recurrenceType={task.recurrence_type} interval={task.recurrence_interval} />
            )}
            {showAssignment && task.assigner && task.assigned_by !== user?.id && (
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <User className="w-3 h-3" />
                Da {task.assigner.full_name}
              </span>
            )}
            {showAssignment && task.assignee && task.created_by === user?.id && (
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <User className="w-3 h-3" />
                A {task.assignee.full_name}
              </span>
            )}
            {task.visibility === 'public' && task.claimer && (
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <User className="w-3 h-3" />
                Preso da {task.claimer.full_name}
              </span>
            )}
          </div>
        </div>

        {/* Priority + Menu */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <PriorityBadge
            priority={task.priority}
            onClick={(p) => onPriorityChange(task, p)}
          />

          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1 rounded hover:bg-gray-100 transition-colors"
            >
              <MoreHorizontal className="w-4 h-4 text-gray-400" />
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <Link
                    href={`/tasks/${task.id}`}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setMenuOpen(false)}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Dettagli
                  </Link>
                  <Link
                    href={`/tasks/new?edit=${task.id}`}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setMenuOpen(false)}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Modifica
                  </Link>
                  {task.created_by === user?.id && (
                    <button
                      onClick={() => {
                        if (confirm('Sei sicuro di voler eliminare questo task?')) {
                          onDelete(task.id)
                        }
                        setMenuOpen(false)
                      }}
                      className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Elimina
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
