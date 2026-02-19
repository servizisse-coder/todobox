'use client'

import { useMemo } from 'react'
import { Globe, Hand } from 'lucide-react'
import Link from 'next/link'
import { AppShell } from '@/components/layout/AppShell'
import { PriorityBadge } from '@/components/tasks/PriorityBadge'
import { DueDateBadge } from '@/components/tasks/DueDateBadge'
import { EmptyState } from '@/components/ui/EmptyState'
import { useTasks } from '@/hooks/useTasks'
import { useAuth } from '@/components/providers/AuthProvider'

export default function PublicTasksPage() {
  const { user } = useAuth()
  const { tasks, loading, claimTask } = useTasks()

  const publicTasks = useMemo(() => {
    return tasks
      .filter(t => t.visibility === 'public' && t.status !== 'done' && t.status !== 'cancelled')
      .sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 }
        return priorityOrder[a.priority] - priorityOrder[b.priority]
      })
  }, [tasks])

  return (
    <AppShell>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-500" />
            <h1 className="text-lg font-bold text-gray-900">Task Pubblici</h1>
          </div>
          <Link
            href="/tasks/new"
            className="px-3 py-1.5 bg-blue-500 text-white text-xs font-medium rounded-lg hover:bg-blue-600 transition-colors"
          >
            + Nuovo pubblico
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-pulse text-sm text-gray-400">Caricamento...</div>
          </div>
        ) : publicTasks.length === 0 ? (
          <EmptyState
            icon={Globe}
            title="Nessun task pubblico"
            description="Non ci sono task pubblici disponibili al momento."
          />
        ) : (
          <div className="space-y-2">
            {publicTasks.map((task) => (
              <div key={task.id} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/tasks/${task.id}`}
                      className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors"
                    >
                      {task.title}
                    </Link>
                    {task.description && (
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{task.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <PriorityBadge priority={task.priority} />
                      {task.due_date && <DueDateBadge dueDate={task.due_date} />}
                      {task.creator && (
                        <span className="text-xs text-gray-400">
                          di {task.creator.full_name}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    {task.claimed_by ? (
                      <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
                        Preso da {task.claimer?.full_name || 'utente'}
                      </span>
                    ) : task.created_by !== user?.id ? (
                      <button
                        onClick={() => claimTask(task)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white text-xs font-medium rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        <Hand className="w-3.5 h-3.5" />
                        Prendi in carico
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400">Il tuo task</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
