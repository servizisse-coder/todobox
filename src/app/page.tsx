'use client'

import { useMemo } from 'react'
import { isToday, isPast, parseISO } from 'date-fns'
import { CalendarDays, Sparkles } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { QuickAdd } from '@/components/tasks/QuickAdd'
import { TaskCard } from '@/components/tasks/TaskCard'
import { ProductivityCounter } from '@/components/tasks/ProductivityCounter'
import { EmptyState } from '@/components/ui/EmptyState'
import { useTasks } from '@/hooks/useTasks'
import { useProductivity } from '@/hooks/useProductivity'
import { useAuth } from '@/components/providers/AuthProvider'

export default function TodayPage() {
  const { user } = useAuth()
  const { tasks, loading, createTask, toggleStatus, updatePriority, deleteTask } = useTasks()

  const myTasks = useMemo(() => {
    if (!user) return []
    return tasks.filter(t =>
      t.created_by === user.id ||
      t.assigned_to === user.id ||
      t.claimed_by === user.id
    )
  }, [tasks, user])

  const todayTasks = useMemo(() => {
    return myTasks.filter((t) => {
      if (t.status === 'cancelled') return false
      const dueToday = t.due_date && isToday(parseISO(t.due_date))
      const overdue = t.due_date && isPast(parseISO(t.due_date)) && !isToday(parseISO(t.due_date)) && t.status !== 'done'
      const isHighPriority = t.priority === 'high' && t.status !== 'done'
      return dueToday || overdue || isHighPriority
    }).sort((a, b) => {
      // Done tasks last
      if (a.status === 'done' && b.status !== 'done') return 1
      if (a.status !== 'done' && b.status === 'done') return -1
      // High priority first
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })
  }, [myTasks])

  const { completed, total } = useProductivity(myTasks)

  const handleQuickAdd = async (title: string, dueDate?: string) => {
    await createTask({
      title,
      due_date: dueDate ? new Date(dueDate).toISOString() : null,
    })
  }

  return (
    <AppShell>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-blue-500" />
          <h1 className="text-lg font-bold text-gray-900">Oggi</h1>
        </div>

        {/* Quick Add */}
        <QuickAdd onAdd={handleQuickAdd} />

        {/* Productivity */}
        <ProductivityCounter completed={completed} total={total} />

        {/* Today's tasks */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-pulse text-sm text-gray-400">Caricamento task...</div>
          </div>
        ) : todayTasks.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="Nessun task urgente"
            description="Non hai task in scadenza oggi o con priorità alta. Goditi la giornata!"
          />
        ) : (
          <div className="space-y-2">
            {todayTasks.map((task) => (
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
