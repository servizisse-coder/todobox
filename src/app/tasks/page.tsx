'use client'

import { useMemo } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { isToday, isPast, parseISO, startOfWeek, endOfWeek } from 'date-fns'
import { AppShell } from '@/components/layout/AppShell'
import { QuickAdd } from '@/components/tasks/QuickAdd'
import { TaskCard } from '@/components/tasks/TaskCard'
import { TaskFilters } from '@/components/tasks/TaskFilters'
import { EmptyState } from '@/components/ui/EmptyState'
import { useTasks } from '@/hooks/useTasks'
import { useRoles } from '@/hooks/useRoles'
import { useFilterStore } from '@/store/filterStore'
import { useAuth } from '@/components/providers/AuthProvider'

export default function MyTasksPage() {
  const { user } = useAuth()
  const { tasks, loading, createTask, toggleStatus, updatePriority, deleteTask } = useTasks()
  const { roles } = useRoles()
  const { filters } = useFilterStore()

  const filteredTasks = useMemo(() => {
    if (!user) return []
    let result = tasks.filter(t =>
      t.created_by === user.id ||
      t.assigned_to === user.id ||
      t.claimed_by === user.id
    )

    if (filters.status !== 'all') {
      result = result.filter(t => t.status === filters.status)
    }
    if (filters.priority !== 'all') {
      result = result.filter(t => t.priority === filters.priority)
    }
    if (filters.type !== 'all') {
      switch (filters.type) {
        case 'personal':
          result = result.filter(t => t.visibility === 'private' && t.created_by === user.id)
          break
        case 'assigned_to_me':
          result = result.filter(t => t.assigned_to === user.id)
          break
        case 'assigned_by_me':
          result = result.filter(t => t.assigned_by === user.id)
          break
        case 'public':
          result = result.filter(t => t.visibility === 'public')
          break
      }
    }
    if (filters.dueDate !== 'all') {
      const now = new Date()
      switch (filters.dueDate) {
        case 'today':
          result = result.filter(t => t.due_date && isToday(parseISO(t.due_date)))
          break
        case 'this_week': {
          const weekStart = startOfWeek(now, { weekStartsOn: 1 })
          const weekEnd = endOfWeek(now, { weekStartsOn: 1 })
          result = result.filter(t => {
            if (!t.due_date) return false
            const d = parseISO(t.due_date)
            return d >= weekStart && d <= weekEnd
          })
          break
        }
        case 'overdue':
          result = result.filter(t => t.due_date && isPast(parseISO(t.due_date)) && !isToday(parseISO(t.due_date)) && t.status !== 'done')
          break
        case 'no_date':
          result = result.filter(t => !t.due_date)
          break
      }
    }
    if (filters.role !== 'all') {
      result = result.filter(t => t.role_id === filters.role)
    }
    if (filters.search) {
      const q = filters.search.toLowerCase()
      result = result.filter(t => t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q))
    }

    // Sort: done last, then by priority
    return result.sort((a, b) => {
      if (a.status === 'done' && b.status !== 'done') return 1
      if (a.status !== 'done' && b.status === 'done') return -1
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })
  }, [tasks, filters, user])

  const handleQuickAdd = async (title: string, roleId?: string, dueDate?: string) => {
    await createTask({
      title,
      role_id: roleId || null,
      due_date: dueDate ? new Date(dueDate + 'T12:00:00').toISOString() : null,
    })
  }

  return (
    <AppShell>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-blue-500" />
          <h1 className="text-lg font-bold text-gray-900">I miei Task</h1>
          <span className="text-sm text-gray-400 ml-auto">{filteredTasks.length} task</span>
        </div>

        <QuickAdd onAdd={handleQuickAdd} roles={roles} />
        <TaskFilters />

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-pulse text-sm text-gray-400">Caricamento...</div>
          </div>
        ) : filteredTasks.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="Nessun task"
            description="Crea il tuo primo task con la barra qui sopra!"
          />
        ) : (
          <div className="space-y-2">
            {filteredTasks.map((task) => (
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
      </div>
    </AppShell>
  )
}
