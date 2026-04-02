'use client'

import { useState, useRef } from 'react'
import { MoreHorizontal, Trash2, Edit3, User, ExternalLink, Play, Square } from 'lucide-react'
import Link from 'next/link'
import type { TodoTask, TaskPriority } from '@/types'
import { PriorityBadge } from './PriorityBadge'
import { DueDateBadge } from './DueDateBadge'
import { RecurringBadge } from './RecurringBadge'
import { RoleBadge } from './RoleBadge'
import { useAuth } from '@/components/providers/AuthProvider'

interface TaskCardProps {
  task: TodoTask
  onToggle: (task: TodoTask) => void
  onStart?: (task: TodoTask) => void
  onPriorityChange: (task: TodoTask, priority: TaskPriority) => void
  onUpdate?: (taskId: string, updates: Partial<TodoTask>) => Promise<boolean>
  onDelete: (taskId: string) => void
  showAssignment?: boolean
}

export function TaskCard({ task, onToggle, onStart, onPriorityChange, onUpdate, onDelete, showAssignment }: TaskCardProps) {
  const { user } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(task.title)
  const editRef = useRef<HTMLInputElement>(null)
  const isDone = task.status === 'done'
  const canEdit = task.created_by === user?.id || task.assigned_to === user?.id || task.claimed_by === user?.id

  const handleSaveTitle = async () => {
    const trimmed = editTitle.trim()
    if (trimmed && trimmed !== task.title && onUpdate) {
      await onUpdate(task.id, { title: trimmed })
    }
    setEditing(false)
  }

  return (
    <div className={`task-card task-enter bg-white border rounded-xl p-3 ${isDone ? 'opacity-60' : ''}`}>
      <div className="flex items-start gap-2">
        {/* Checkbox — min 44px touch target */}
        <button
          onClick={() => onToggle(task)}
          className={`
            mt-0.5 w-7 h-7 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all task-checkbox
            ${isDone
              ? 'border-green-500 bg-green-500 checked'
              : 'border-gray-300 hover:border-blue-400'
            }
          `}
        >
          {isDone && (
            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        {/* Play/Stop button — min 44px touch target */}
        {!isDone && onStart && (
          task.status === 'todo' ? (
            <button
              onClick={() => onStart(task)}
              className="mt-0.5 w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-full text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-all"
              title="Avvia task"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
            </button>
          ) : task.status === 'in_progress' ? (
            <button
              onClick={() => onToggle(task)}
              className="mt-0.5 w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-full text-blue-500 animate-pulse hover:text-green-500 hover:bg-green-50 transition-all"
              title="Completa task"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
            </button>
          ) : null
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {editing ? (
              <input
                ref={editRef}
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={handleSaveTitle}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveTitle()
                  if (e.key === 'Escape') { setEditTitle(task.title); setEditing(false) }
                }}
                className="flex-1 text-sm font-medium text-gray-900 outline-none border-b-2 border-blue-500 bg-transparent"
                autoFocus
              />
            ) : (
              <Link
                href={`/tasks/${task.id}`}
                onDoubleClick={(e) => {
                  if (canEdit && onUpdate) {
                    e.preventDefault()
                    setEditTitle(task.title)
                    setEditing(true)
                  }
                }}
                className={`text-sm font-medium truncate hover:text-blue-600 transition-colors ${isDone ? 'line-through text-gray-400' : 'text-gray-900'}`}
              >
                {task.title}
              </Link>
            )}
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {task.role && (
              <RoleBadge role={task.role} />
            )}
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
