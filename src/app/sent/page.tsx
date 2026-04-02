'use client'

import { useMemo } from 'react'
import { Send, Check, Clock, XCircle } from 'lucide-react'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { AppShell } from '@/components/layout/AppShell'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatusBadge } from '@/components/tasks/StatusBadge'
import { PriorityBadge } from '@/components/tasks/PriorityBadge'
import { useAssignments } from '@/hooks/useAssignments'
import Link from 'next/link'
import type { TodoAssignment, TaskStatus, TaskPriority } from '@/types'

interface GroupedTask {
  taskId: string
  taskTitle: string
  taskStatus?: string
  taskPriority?: string
  createdAt: string
  assignments: TodoAssignment[]
}

export default function SentPage() {
  const { assignedByMe, loading, revokeAssignment } = useAssignments()

  // Group assignments by task
  const groupedTasks = useMemo(() => {
    const map = new Map<string, GroupedTask>()
    for (const assignment of assignedByMe) {
      const taskData = assignment.task as { id?: string; title?: string; status?: string; priority?: string } | undefined
      const taskId = taskData?.id || assignment.task_id
      if (!map.has(taskId)) {
        map.set(taskId, {
          taskId,
          taskTitle: taskData?.title || 'Task',
          taskStatus: taskData?.status,
          taskPriority: taskData?.priority,
          createdAt: assignment.created_at,
          assignments: [],
        })
      }
      map.get(taskId)!.assignments.push(assignment)
    }
    return Array.from(map.values()).sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }, [assignedByMe])

  const totalTasks = groupedTasks.length
  const totalAssignments = assignedByMe.length

  return (
    <AppShell>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Send className="w-5 h-5 text-blue-500" />
          <h1 className="text-lg font-bold text-gray-900">Assegnati da me</h1>
          <span className="text-sm text-gray-400 ml-auto">
            {totalTasks} task{totalAssignments > totalTasks ? ` (${totalAssignments} assegnazioni)` : ''}
          </span>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-pulse text-sm text-gray-400">Caricamento...</div>
          </div>
        ) : groupedTasks.length === 0 ? (
          <EmptyState
            icon={Send}
            title="Nessun task assegnato"
            description="Non hai ancora assegnato task ad altri utenti."
            action={
              <Link
                href="/tasks/new"
                className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600"
              >
                Crea e assegna
              </Link>
            }
          />
        ) : (
          <div className="space-y-3">
            {groupedTasks.map((group) => (
              <Link
                key={group.taskId}
                href={`/tasks/${group.taskId}`}
                className="block bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow"
              >
                {/* Task header */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {group.taskTitle}
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {format(new Date(group.createdAt), 'd MMM yyyy', { locale: it })}
                    </p>
                  </div>
                  {group.taskStatus && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <StatusBadge status={group.taskStatus as TaskStatus} />
                      {group.taskPriority && (
                        <PriorityBadge priority={group.taskPriority as TaskPriority} />
                      )}
                    </div>
                  )}
                </div>

                {/* Recipients list */}
                <div className="space-y-1.5 border-t border-gray-100 pt-2">
                  {group.assignments.map((assignment) => {
                    const recipient = assignment.recipient as { full_name?: string } | undefined
                    return (
                      <div key={assignment.id} className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-medium flex-shrink-0">
                          {recipient?.full_name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <span className="text-xs text-gray-700 flex-1">{recipient?.full_name || 'Utente'}</span>

                        {assignment.status === 'accepted' && (
                          <span className="flex items-center gap-1 text-xs text-green-600">
                            <Check className="w-3 h-3" /> Accettato
                          </span>
                        )}
                        {assignment.status === 'pending' && (
                          <span className="flex items-center gap-1 text-xs text-amber-600">
                            <Clock className="w-3 h-3" /> In attesa
                          </span>
                        )}
                        {assignment.status === 'declined' && (
                          <span className="flex items-center gap-1 text-xs text-red-600">
                            <XCircle className="w-3 h-3" /> Rifiutato
                          </span>
                        )}

                        {(assignment.status === 'pending' || assignment.status === 'accepted') && (
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              if (confirm(`Revocare l'assegnazione a ${recipient?.full_name || 'questo utente'}?`)) {
                                revokeAssignment(assignment.id)
                              }
                            }}
                            className="text-xs text-red-500 hover:text-red-700 px-1.5 py-0.5 rounded hover:bg-red-50"
                          >
                            Revoca
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Decline reasons */}
                {group.assignments.some(a => a.status === 'declined' && a.decline_reason) && (
                  <div className="mt-2 space-y-1">
                    {group.assignments
                      .filter(a => a.status === 'declined' && a.decline_reason)
                      .map(a => {
                        const recipient = a.recipient as { full_name?: string } | undefined
                        return (
                          <p key={a.id} className="text-xs text-red-500 bg-red-50 rounded-lg p-2">
                            {recipient?.full_name}: {a.decline_reason}
                          </p>
                        )
                      })}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
