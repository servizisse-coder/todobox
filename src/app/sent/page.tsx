'use client'

import { Send } from 'lucide-react'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { AppShell } from '@/components/layout/AppShell'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatusBadge } from '@/components/tasks/StatusBadge'
import { PriorityBadge } from '@/components/tasks/PriorityBadge'
import { useAssignments } from '@/hooks/useAssignments'
import Link from 'next/link'

const assignmentStatusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: 'In attesa', color: 'text-amber-600 bg-amber-50' },
  accepted: { label: 'Accettato', color: 'text-green-600 bg-green-50' },
  declined: { label: 'Rifiutato', color: 'text-red-600 bg-red-50' },
}

export default function SentPage() {
  const { assignedByMe, loading } = useAssignments()

  return (
    <AppShell>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Send className="w-5 h-5 text-blue-500" />
          <h1 className="text-lg font-bold text-gray-900">Assegnati da me</h1>
          <span className="text-sm text-gray-400 ml-auto">{assignedByMe.length} task</span>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-pulse text-sm text-gray-400">Caricamento...</div>
          </div>
        ) : assignedByMe.length === 0 ? (
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
          <div className="space-y-2">
            {assignedByMe.map((assignment) => {
              const taskData = assignment.task as { id?: string; title?: string; status?: string; priority?: string } | undefined
              const recipient = assignment.recipient as { full_name?: string } | undefined
              const statusConf = assignmentStatusConfig[assignment.status] || assignmentStatusConfig.pending

              return (
                <Link
                  key={assignment.id}
                  href={taskData?.id ? `/tasks/${taskData.id}` : '#'}
                  className="block bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {taskData?.title || 'Task'}
                      </h3>
                      <p className="text-xs text-gray-400 mt-0.5">
                        A: {recipient?.full_name || 'Utente'} &middot;{' '}
                        {format(new Date(assignment.created_at), 'd MMM yyyy', { locale: it })}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusConf.color}`}>
                        {statusConf.label}
                      </span>
                    </div>
                  </div>

                  {assignment.status === 'declined' && assignment.decline_reason && (
                    <p className="text-xs text-red-500 mt-2 bg-red-50 rounded-lg p-2">
                      Motivo: {assignment.decline_reason}
                    </p>
                  )}

                  {assignment.status === 'accepted' && taskData?.status && (
                    <div className="mt-2 flex items-center gap-2">
                      <StatusBadge status={taskData.status as import('@/types').TaskStatus} />
                      {taskData.priority && (
                        <PriorityBadge priority={taskData.priority as import('@/types').TaskPriority} />
                      )}
                    </div>
                  )}
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </AppShell>
  )
}
