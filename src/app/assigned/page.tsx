'use client'

import { Inbox, Check, X } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { TaskCard } from '@/components/tasks/TaskCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { useTasks } from '@/hooks/useTasks'
import { useAssignments } from '@/hooks/useAssignments'
import { useState } from 'react'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'

export default function AssignedToMePage() {
  const { tasks, toggleStatus, updatePriority, deleteTask } = useTasks()
  const { assignedToMe, loading, respondToAssignment } = useAssignments()
  const [declineId, setDeclineId] = useState<string | null>(null)
  const [declineReason, setDeclineReason] = useState('')
  const [responding, setResponding] = useState(false)

  const pendingAssignments = assignedToMe.filter(a => a.status === 'pending')
  const acceptedAssignments = assignedToMe.filter(a => a.status === 'accepted')

  const acceptedTaskIds = acceptedAssignments.map(a => a.task_id)
  const acceptedTasks = tasks.filter(t => acceptedTaskIds.includes(t.id))

  const handleAccept = async (assignmentId: string) => {
    setResponding(true)
    await respondToAssignment(assignmentId, true)
    setResponding(false)
  }

  const handleDecline = async (assignmentId: string) => {
    setResponding(true)
    await respondToAssignment(assignmentId, false, declineReason || undefined)
    setDeclineId(null)
    setDeclineReason('')
    setResponding(false)
  }

  return (
    <AppShell>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Inbox className="w-5 h-5 text-blue-500" />
          <h1 className="text-lg font-bold text-gray-900">Assegnati a me</h1>
        </div>

        {/* Pending assignments */}
        {pendingAssignments.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-medium text-gray-500">In attesa di risposta</h2>
            {pendingAssignments.map((assignment) => {
              const taskData = assignment.task as { title?: string; description?: string; priority?: string } | undefined
              return (
                <div key={assignment.id} className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">
                        {taskData?.title || 'Task'}
                      </h3>
                      {taskData?.description && (
                        <p className="text-xs text-gray-500 mt-0.5">{taskData.description}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        Da {(assignment.sender as { full_name?: string })?.full_name || 'Utente'} &middot;{' '}
                        {format(new Date(assignment.created_at), 'd MMM yyyy', { locale: it })}
                      </p>
                    </div>
                  </div>

                  {declineId === assignment.id ? (
                    <div className="mt-3 space-y-2">
                      <input
                        type="text"
                        value={declineReason}
                        onChange={(e) => setDeclineReason(e.target.value)}
                        placeholder="Motivo del rifiuto (opzionale)..."
                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDecline(assignment.id)}
                          disabled={responding}
                          className="px-3 py-1.5 bg-red-500 text-white text-xs font-medium rounded-lg hover:bg-red-600 disabled:opacity-50"
                        >
                          Conferma rifiuto
                        </button>
                        <button
                          onClick={() => { setDeclineId(null); setDeclineReason('') }}
                          className="px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100 rounded-lg"
                        >
                          Annulla
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleAccept(assignment.id)}
                        disabled={responding}
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white text-xs font-medium rounded-lg hover:bg-green-600 disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Accetta
                      </button>
                      <button
                        onClick={() => setDeclineId(assignment.id)}
                        disabled={responding}
                        className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50"
                      >
                        <X className="w-3.5 h-3.5" />
                        Rifiuta
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Accepted tasks */}
        {acceptedTasks.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-medium text-gray-500">Task accettati</h2>
            {acceptedTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggle={toggleStatus}
                onPriorityChange={updatePriority}
                onDelete={deleteTask}
                showAssignment
              />
            ))}
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-pulse text-sm text-gray-400">Caricamento...</div>
          </div>
        ) : pendingAssignments.length === 0 && acceptedTasks.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="Nessun task assegnato"
            description="Non hai task assegnati da altri utenti."
          />
        ) : null}
      </div>
    </AppShell>
  )
}
