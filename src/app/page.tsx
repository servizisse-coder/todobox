'use client'

import { useMemo } from 'react'
import { isToday, isPast, isTomorrow, parseISO, startOfWeek, endOfWeek, isWithinInterval, isAfter } from 'date-fns'
import { CalendarDays, Sparkles, AlertTriangle, Clock, ArrowRight, CalendarCheck } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { QuickAdd } from '@/components/tasks/QuickAdd'
import { TaskCard } from '@/components/tasks/TaskCard'
import { ProductivityCounter } from '@/components/tasks/ProductivityCounter'
import { EmptyState } from '@/components/ui/EmptyState'
import { useTasks } from '@/hooks/useTasks'
import { useRoles } from '@/hooks/useRoles'
import { useProductivity } from '@/hooks/useProductivity'
import { useAuth } from '@/components/providers/AuthProvider'
import type { TodoTask } from '@/types'

type UrgencyGroup = 'overdue' | 'due_today' | 'tomorrow' | 'this_week' | 'future' | 'no_date'

function getUrgencyGroup(task: TodoTask): UrgencyGroup {
  if (!task.due_date) return 'no_date'
  const dueDate = parseISO(task.due_date)
  const today = new Date()

  if (isToday(dueDate)) return 'due_today'
  if (isPast(dueDate)) return 'overdue'
  if (isTomorrow(dueDate)) return 'tomorrow'

  const weekEnd = endOfWeek(today, { weekStartsOn: 1 })
  if (isWithinInterval(dueDate, { start: today, end: weekEnd })) return 'this_week'

  return 'future'
}

const urgencyOrder: Record<UrgencyGroup, number> = {
  overdue: 0,
  due_today: 1,
  tomorrow: 2,
  this_week: 3,
  future: 4,
  no_date: 5,
}

const urgencyLabels: Record<UrgencyGroup, { label: string; color: string; icon: typeof AlertTriangle }> = {
  overdue: { label: 'In ritardo', color: 'text-red-600', icon: AlertTriangle },
  due_today: { label: 'Oggi', color: 'text-amber-600', icon: Clock },
  tomorrow: { label: 'Domani', color: 'text-blue-600', icon: ArrowRight },
  this_week: { label: 'Questa settimana', color: 'text-gray-600', icon: CalendarDays },
  future: { label: 'Prossimamente', color: 'text-gray-400', icon: CalendarCheck },
  no_date: { label: 'Senza scadenza', color: 'text-gray-400', icon: CalendarDays },
}

const priorityOrder = { high: 0, medium: 1, low: 2 }

export default function TodayPage() {
  const { user } = useAuth()
  const { tasks, loading, createTask, toggleStatus, updatePriority, deleteTask } = useTasks()
  const { roles } = useRoles()

  const myTasks = useMemo(() => {
    if (!user) return []
    return tasks.filter(t =>
      t.created_by === user.id ||
      t.assigned_to === user.id ||
      t.claimed_by === user.id
    )
  }, [tasks, user])

  // Active tasks grouped by urgency
  const groupedTasks = useMemo(() => {
    const active = myTasks.filter(t => t.status !== 'done' && t.status !== 'cancelled')

    const groups = new Map<UrgencyGroup, TodoTask[]>()

    active.forEach((task) => {
      const group = getUrgencyGroup(task)
      if (!groups.has(group)) groups.set(group, [])
      groups.get(group)!.push(task)
    })

    // Sort within each group by priority
    groups.forEach((groupTasks) => {
      groupTasks.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
    })

    // Return sorted entries
    return Array.from(groups.entries())
      .sort(([a], [b]) => urgencyOrder[a] - urgencyOrder[b])
  }, [myTasks])

  // Tasks completed today
  const completedToday = useMemo(() => {
    return myTasks.filter(t =>
      t.status === 'done' &&
      t.completed_at &&
      isToday(parseISO(t.completed_at))
    )
  }, [myTasks])

  const todayActiveTasks = useMemo(() => myTasks.filter(t => t.status !== 'done' && t.status !== 'cancelled'), [myTasks])
  const { completed, total } = useProductivity(myTasks)

  const handleQuickAdd = async (title: string, roleId?: string, dueDate?: string) => {
    await createTask({
      title,
      role_id: roleId || null,
      due_date: dueDate ? new Date(dueDate + 'T12:00:00').toISOString() : null,
    })
  }

  const totalActive = groupedTasks.reduce((sum, [, tasks]) => sum + tasks.length, 0)

  return (
    <AppShell>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-blue-500" />
          <h1 className="text-lg font-bold text-gray-900">Oggi</h1>
        </div>

        {/* Quick Add */}
        <QuickAdd onAdd={handleQuickAdd} roles={roles} />

        {/* Productivity */}
        <ProductivityCounter completed={completed} total={total} />

        {/* Tasks by urgency group */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-pulse text-sm text-gray-400">Caricamento task...</div>
          </div>
        ) : totalActive === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="Nessun task attivo"
            description="Non hai task aperti. Aggiungi un task per iniziare!"
          />
        ) : (
          <div className="space-y-4">
            {groupedTasks.map(([group, groupTasks]) => {
              const { label, color, icon: Icon } = urgencyLabels[group]
              return (
                <div key={group}>
                  <div className={`flex items-center gap-1.5 mb-2 ${color}`}>
                    <Icon className="w-4 h-4" />
                    <span className="text-xs font-semibold uppercase tracking-wide">
                      {label} ({groupTasks.length})
                    </span>
                  </div>
                  <div className="space-y-2">
                    {groupTasks.map((task) => (
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
                </div>
              )
            })}
          </div>
        )}

        {/* Completed today */}
        {completedToday.length > 0 && (
          <details className="mt-4">
            <summary className="text-xs font-medium text-gray-400 cursor-pointer hover:text-gray-600">
              Completati oggi ({completedToday.length})
            </summary>
            <div className="space-y-2 mt-2">
              {completedToday.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggle={toggleStatus}
                  onPriorityChange={updatePriority}
                  onDelete={deleteTask}
                />
              ))}
            </div>
          </details>
        )}
      </div>
    </AppShell>
  )
}
