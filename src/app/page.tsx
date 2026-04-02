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
import { useAssignments } from '@/hooks/useAssignments'
import { useProductivity } from '@/hooks/useProductivity'
import { useFilterStore } from '@/store/filterStore'
import { useAuth } from '@/components/providers/AuthProvider'
import { TaskSkeleton } from '@/components/ui/TaskSkeleton'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
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
  const { tasks, loading, createTask, toggleStatus, startTask, updatePriority, updateTask, deleteTask } = useTasks()
  const { roles } = useRoles()
  const { assignTask } = useAssignments()
  const { filters, setFilter } = useFilterStore()

  useKeyboardShortcuts({
    onQuickAdd: () => document.getElementById('quickadd-input')?.focus(),
  })

  // Work queue: tasks I need to do personally (exclude delegated)
  const myTasks = useMemo(() => {
    if (!user) return []
    return tasks.filter(t => {
      // Delegated: I created it but someone else is assigned → exclude
      if (t.created_by === user.id && t.assigned_to && t.assigned_to !== user.id) return false
      // Include: my own tasks, tasks assigned to me, tasks I claimed
      return t.created_by === user.id || t.assigned_to === user.id || t.claimed_by === user.id
    })
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

    // Return sorted entries, optionally filtered to urgent only
    return Array.from(groups.entries())
      .filter(([group]) => !filters.urgentOnly || group === 'overdue' || group === 'due_today')
      .sort(([a], [b]) => urgencyOrder[a] - urgencyOrder[b])
  }, [myTasks, filters.urgentOnly])

  // Tasks completed today
  const completedToday = useMemo(() => {
    return myTasks.filter(t =>
      t.status === 'done' &&
      t.completed_at &&
      isToday(parseISO(t.completed_at))
    )
  }, [myTasks])

  const { completed, total, completedByMe, delegatedCompleted } = useProductivity(myTasks)

  const handleQuickAdd = async (title: string, roleId?: string, dueDate?: string, assignToUserIds?: string[]) => {
    const hasAssignees = assignToUserIds && assignToUserIds.length > 0
    const task = await createTask({
      title,
      role_id: roleId || null,
      due_date: dueDate ? new Date(dueDate + 'T12:00:00').toISOString() : null,
      ...(hasAssignees ? { visibility: 'assigned', assigned_by: user?.id } : {}),
    })
    if (hasAssignees && task?.id) {
      for (const userId of assignToUserIds) {
        await assignTask(task.id, userId)
      }
    }
  }

  const totalActive = groupedTasks.reduce((sum, [, tasks]) => sum + tasks.length, 0)

  return (
    <AppShell>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-blue-500" />
          <h1 className="text-lg font-bold text-gray-900">Oggi</h1>
          <button
            onClick={() => setFilter('urgentOnly', !filters.urgentOnly)}
            className={`ml-auto text-xs px-2.5 py-1 rounded-full border transition-colors ${
              filters.urgentOnly
                ? 'bg-red-50 text-red-600 border-red-200'
                : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50'
            }`}
          >
            Solo urgenti
          </button>
        </div>

        {/* Quick Add */}
        <QuickAdd onAdd={handleQuickAdd} roles={roles} />

        {/* Productivity */}
        <ProductivityCounter completed={completed} total={total} completedByMe={completedByMe} delegatedCompleted={delegatedCompleted} />

        {/* Tasks by urgency group */}
        {loading ? (
          <TaskSkeleton count={4} />
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
                        onStart={startTask}
                        onPriorityChange={updatePriority}
                        onUpdate={updateTask}
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
                  onUpdate={updateTask}
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
