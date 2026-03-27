'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { BarChart3 } from 'lucide-react'
import { startOfWeek, endOfWeek, parseISO, isWithinInterval, isPast, isToday, format } from 'date-fns'
import { it } from 'date-fns/locale'
import { AppShell } from '@/components/layout/AppShell'
import { RoleReviewCard } from '@/components/review/RoleReviewCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { useTasks } from '@/hooks/useTasks'
import { useRoles } from '@/hooks/useRoles'
import { useAuth } from '@/components/providers/AuthProvider'

export default function ReviewPage() {
  const { user } = useAuth()
  const { tasks } = useTasks()
  const { roles, loading } = useRoles()
  const router = useRouter()

  const now = new Date()
  const weekStart = startOfWeek(now, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 })

  const myTasks = useMemo(() => {
    if (!user) return []
    return tasks.filter(t => t.created_by === user.id)
  }, [tasks, user])

  const roleStats = useMemo(() => {
    const stats: Record<string, { completed: number; open: number; overdue: number; createdThisWeek: number }> = {}

    // Initialize all roles
    roles.forEach(r => {
      stats[r.id] = { completed: 0, open: 0, overdue: 0, createdThisWeek: 0 }
    })

    myTasks.forEach(task => {
      if (!task.role_id || !stats[task.role_id]) return

      const s = stats[task.role_id]

      // Completed this week
      if (task.status === 'done' && task.completed_at) {
        const completedDate = parseISO(task.completed_at)
        if (isWithinInterval(completedDate, { start: weekStart, end: weekEnd })) {
          s.completed++
        }
      }

      // Open (not done, not cancelled)
      if (task.status !== 'done' && task.status !== 'cancelled') {
        s.open++

        // Overdue
        if (task.due_date) {
          const dueDate = parseISO(task.due_date)
          if (isPast(dueDate) && !isToday(dueDate)) {
            s.overdue++
          }
        }
      }

      // Created this week
      const createdDate = parseISO(task.created_at)
      if (isWithinInterval(createdDate, { start: weekStart, end: weekEnd })) {
        s.createdThisWeek++
      }
    })

    return stats
  }, [myTasks, roles, weekStart, weekEnd])

  // Summary totals
  const totals = useMemo(() => {
    return Object.values(roleStats).reduce(
      (acc, s) => ({
        completed: acc.completed + s.completed,
        open: acc.open + s.open,
        overdue: acc.overdue + s.overdue,
      }),
      { completed: 0, open: 0, overdue: 0 }
    )
  }, [roleStats])

  // Tasks without role
  const noRoleTasks = useMemo(() => {
    return myTasks.filter(t => !t.role_id && t.status !== 'done' && t.status !== 'cancelled')
  }, [myTasks])

  const handleRoleClick = (roleId: string) => {
    router.push(`/tasks?role=${roleId}`)
  }

  return (
    <AppShell>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-500" />
          <h1 className="text-lg font-bold text-gray-900">Revisione Settimanale</h1>
        </div>

        <p className="text-xs text-gray-400">
          Settimana del {format(weekStart, 'd MMMM', { locale: it })} — {format(weekEnd, 'd MMMM yyyy', { locale: it })}
        </p>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white border border-gray-200 rounded-xl p-3 text-center">
            <div className="text-xl font-bold text-green-600">{totals.completed}</div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wide">Completati</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-3 text-center">
            <div className="text-xl font-bold text-blue-600">{totals.open}</div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wide">Aperti</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-3 text-center">
            <div className={`text-xl font-bold ${totals.overdue > 0 ? 'text-red-600' : 'text-gray-300'}`}>{totals.overdue}</div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wide">Scaduti</div>
          </div>
        </div>

        {/* Per-role cards */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-pulse text-sm text-gray-400">Caricamento...</div>
          </div>
        ) : roles.length === 0 ? (
          <EmptyState
            icon={BarChart3}
            title="Nessun ruolo configurato"
            description="Vai nelle Impostazioni per creare i tuoi ruoli e organizzare i task."
          />
        ) : (
          <div className="space-y-2">
            {roles.map((role) => {
              const stats = roleStats[role.id] || { completed: 0, open: 0, overdue: 0, createdThisWeek: 0 }
              const inactive = stats.completed === 0 && stats.createdThisWeek === 0 && stats.open === 0
              return (
                <RoleReviewCard
                  key={role.id}
                  role={role}
                  stats={stats}
                  inactive={inactive}
                  onClick={() => handleRoleClick(role.id)}
                />
              )
            })}
          </div>
        )}

        {/* Tasks without role */}
        {noRoleTasks.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
            <p className="text-xs text-amber-700 font-medium">
              {noRoleTasks.length} task senza ruolo assegnato
            </p>
            <p className="text-xs text-amber-500 mt-0.5">
              Assegna un ruolo per una migliore organizzazione
            </p>
          </div>
        )}
      </div>
    </AppShell>
  )
}
