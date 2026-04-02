'use client'

import { useState, useEffect, use } from 'react'
import { ArrowLeft, Eye, ListTodo, AlertTriangle, CheckCircle2, Clock, Timer } from 'lucide-react'
import Link from 'next/link'
import { isToday, isPast, parseISO, startOfWeek } from 'date-fns'
import { AppShell } from '@/components/layout/AppShell'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatusBadge } from '@/components/tasks/StatusBadge'
import { PriorityBadge } from '@/components/tasks/PriorityBadge'
import { DueDateBadge } from '@/components/tasks/DueDateBadge'
import { RoleBadge } from '@/components/tasks/RoleBadge'
import { useSupervisor } from '@/hooks/useSupervisor'
import { useWorkSchedule } from '@/hooks/useWorkSchedule'
import type { TodoTask, TaskStatus } from '@/types'

type FilterStatus = 'all' | 'open' | 'overdue' | 'done'

export default function SupervisorUserPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params)
  const { isSupervisor, supervisedUsers, fetchUserTasks, loading: supervisorLoading } = useSupervisor()
  const [tasks, setTasks] = useState<TodoTask[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterStatus>('open')

  const { schedule, getWeeklyMinutes } = useWorkSchedule(userId)
  const supervisedUser = supervisedUsers.find(u => u.id === userId)

  useEffect(() => {
    if (!isSupervisor || supervisorLoading) return
    const load = async () => {
      const data = await fetchUserTasks(userId)
      setTasks(data)
      setLoading(false)
    }
    load()
  }, [isSupervisor, supervisorLoading, userId, fetchUserTasks])

  const filteredTasks = tasks.filter(t => {
    switch (filter) {
      case 'open':
        return t.status !== 'done' && t.status !== 'cancelled'
      case 'overdue':
        return t.status !== 'done' && t.status !== 'cancelled' && t.due_date && isPast(parseISO(t.due_date)) && !isToday(parseISO(t.due_date))
      case 'done':
        return t.status === 'done'
      default:
        return true
    }
  })

  // Calculate worked minutes this week
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  const workedMinutesThisWeek = tasks.reduce((sum, t) => {
    if (t.status === 'done' && t.started_at && t.completed_at) {
      const completedDate = new Date(t.completed_at)
      if (completedDate >= weekStart) {
        const diffMs = completedDate.getTime() - new Date(t.started_at).getTime()
        return sum + Math.floor(diffMs / 60000)
      }
    }
    return sum
  }, 0)
  const scheduleMinutesWeek = getWeeklyMinutes()

  const openCount = tasks.filter(t => t.status !== 'done' && t.status !== 'cancelled').length
  const overdueCount = tasks.filter(t => t.status !== 'done' && t.status !== 'cancelled' && t.due_date && isPast(parseISO(t.due_date)) && !isToday(parseISO(t.due_date))).length
  const doneCount = tasks.filter(t => t.status === 'done').length

  if (supervisorLoading || loading) {
    return (
      <AppShell>
        <div className="text-center py-16">
          <div className="animate-pulse text-sm text-gray-400">Caricamento task...</div>
        </div>
      </AppShell>
    )
  }

  if (!isSupervisor) {
    return (
      <AppShell>
        <EmptyState icon={Eye} title="Accesso non autorizzato" description="Non hai i permessi per visualizzare questa sezione." />
      </AppShell>
    )
  }

  const filterButtons: { key: FilterStatus; label: string; count: number; icon: typeof ListTodo }[] = [
    { key: 'all', label: 'Tutti', count: tasks.length, icon: ListTodo },
    { key: 'open', label: 'Aperti', count: openCount, icon: Clock },
    { key: 'overdue', label: 'Ritardo', count: overdueCount, icon: AlertTriangle },
    { key: 'done', label: 'Completati', count: doneCount, icon: CheckCircle2 },
  ]

  return (
    <AppShell>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Link href="/supervisor" className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-gray-900">{supervisedUser?.full_name || 'Utente'}</h1>
            <p className="text-xs text-gray-400">{supervisedUser?.email}</p>
          </div>
          <span className="flex items-center gap-1 text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full font-medium">
            <Eye className="w-3 h-3" /> Supervisore
          </span>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto">
          {filterButtons.map(({ key, label, count, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                filter === key
                  ? 'bg-blue-50 text-blue-600 border border-blue-200'
                  : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label} ({count})
            </button>
          ))}
        </div>

        {/* Weekly time tracking */}
        {scheduleMinutesWeek > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-2">
              <Timer className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-700">Tempo lavorato (settimana)</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    workedMinutesThisWeek / scheduleMinutesWeek > 0.9 ? 'bg-green-500' :
                    workedMinutesThisWeek / scheduleMinutesWeek > 0.5 ? 'bg-blue-500' : 'bg-amber-500'
                  }`}
                  style={{ width: `${Math.min(100, (workedMinutesThisWeek / scheduleMinutesWeek) * 100)}%` }}
                />
              </div>
              <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                {Math.floor(workedMinutesThisWeek / 60)}h {workedMinutesThisWeek % 60}m / {Math.floor(scheduleMinutesWeek / 60)}h
              </span>
            </div>
          </div>
        )}

        {/* Tasks list (read-only) */}
        {filteredTasks.length === 0 ? (
          <EmptyState
            icon={ListTodo}
            title="Nessun task"
            description={filter === 'all' ? 'Questo utente non ha task.' : 'Nessun task con questo filtro.'}
          />
        ) : (
          <div className="space-y-2">
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                className={`bg-white border border-gray-200 rounded-xl p-3 ${task.status === 'done' ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${task.status === 'done' ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <StatusBadge status={task.status} />
                      {task.role && <RoleBadge role={task.role} />}
                      {task.due_date && <DueDateBadge dueDate={task.due_date} completed={task.status === 'done'} />}
                    </div>
                    {(task.referent || task.company) && (
                      <div className="flex items-center gap-3 mt-1">
                        {task.referent && <span className="text-xs text-gray-400">Ref: {task.referent}</span>}
                        {task.company && <span className="text-xs text-gray-400">Az: {task.company}</span>}
                      </div>
                    )}
                  </div>
                  <PriorityBadge priority={task.priority} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
