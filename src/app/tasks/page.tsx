'use client'

import { CheckCircle2 } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { QuickAdd } from '@/components/tasks/QuickAdd'
import { TaskCard } from '@/components/tasks/TaskCard'
import { TaskFilters } from '@/components/tasks/TaskFilters'
import { EmptyState } from '@/components/ui/EmptyState'
import { TaskSkeleton } from '@/components/ui/TaskSkeleton'
import { useTasks } from '@/hooks/useTasks'
import { useRoles } from '@/hooks/useRoles'
import { useAssignments } from '@/hooks/useAssignments'
import { useFilterStore } from '@/store/filterStore'
import { useAuth } from '@/components/providers/AuthProvider'
import { useArchiveFilters, useTaskSuggestions } from '@/hooks/useFilteredTasks'

export default function MyTasksPage() {
  const { user } = useAuth()
  const { tasks, loading, createTask, toggleStatus, startTask, updatePriority, updateTask, deleteTask } = useTasks()
  const { roles } = useRoles()
  const { assignTask } = useAssignments()
  const { filters } = useFilterStore()

  const { referentSuggestions, companySuggestions } = useTaskSuggestions(tasks)
  const filteredTasks = useArchiveFilters(tasks, filters)

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

  return (
    <AppShell>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-blue-500" />
          <h1 className="text-lg font-bold text-gray-900">I miei Task</h1>
          <span className="text-sm text-gray-400 ml-auto">{filteredTasks.length} task</span>
        </div>

        <QuickAdd onAdd={handleQuickAdd} roles={roles} />
        <TaskFilters showAdvanced referentSuggestions={referentSuggestions} companySuggestions={companySuggestions} />

        {loading ? (
          <TaskSkeleton count={5} />
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
                onStart={startTask}
                onPriorityChange={updatePriority}
                onUpdate={updateTask}
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
