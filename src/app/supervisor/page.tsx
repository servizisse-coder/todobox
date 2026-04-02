'use client'

import { Users, AlertTriangle, CheckCircle2, ListTodo } from 'lucide-react'
import Link from 'next/link'
import { AppShell } from '@/components/layout/AppShell'
import { EmptyState } from '@/components/ui/EmptyState'
import { useSupervisor } from '@/hooks/useSupervisor'

export default function SupervisorPage() {
  const { isSupervisor, userStats, loading } = useSupervisor()

  if (loading) {
    return (
      <AppShell>
        <div className="text-center py-16">
          <div className="animate-pulse text-sm text-gray-400">Caricamento dashboard team...</div>
        </div>
      </AppShell>
    )
  }

  if (!isSupervisor) {
    return (
      <AppShell>
        <EmptyState
          icon={Users}
          title="Accesso non autorizzato"
          description="Non hai i permessi per visualizzare questa sezione."
        />
      </AppShell>
    )
  }

  const totalOverdue = userStats.reduce((sum, s) => sum + s.overdue, 0)
  const totalOpen = userStats.reduce((sum, s) => sum + s.totalOpen, 0)
  const totalCompletedWeek = userStats.reduce((sum, s) => sum + s.completedThisWeek, 0)

  return (
    <AppShell>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-500" />
          <h1 className="text-lg font-bold text-gray-900">Dashboard Team</h1>
          <span className="text-sm text-gray-400 ml-auto">{userStats.length} membri</span>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white border border-gray-200 rounded-xl p-3 text-center">
            <ListTodo className="w-5 h-5 text-blue-500 mx-auto mb-1" />
            <p className="text-xl font-bold text-gray-900">{totalOpen}</p>
            <p className="text-xs text-gray-400">Task aperti</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-3 text-center">
            <AlertTriangle className={`w-5 h-5 mx-auto mb-1 ${totalOverdue > 0 ? 'text-red-500' : 'text-gray-300'}`} />
            <p className={`text-xl font-bold ${totalOverdue > 0 ? 'text-red-600' : 'text-gray-900'}`}>{totalOverdue}</p>
            <p className="text-xs text-gray-400">In ritardo</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-3 text-center">
            <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto mb-1" />
            <p className="text-xl font-bold text-gray-900">{totalCompletedWeek}</p>
            <p className="text-xs text-gray-400">Chiusi (sett.)</p>
          </div>
        </div>

        {/* User cards */}
        <div className="space-y-2">
          {userStats.map((stat) => (
            <Link
              key={stat.user.id}
              href={`/supervisor/${stat.user.id}`}
              className="block bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {stat.user.full_name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900">{stat.user.full_name}</h3>
                  <p className="text-xs text-gray-400">{stat.user.department || stat.user.email}</p>
                </div>

                <div className="flex items-center gap-4 text-center flex-shrink-0">
                  <div>
                    <p className="text-sm font-bold text-gray-900">{stat.totalOpen}</p>
                    <p className="text-[10px] text-gray-400">Aperti</p>
                  </div>
                  {stat.overdue > 0 && (
                    <div>
                      <p className="text-sm font-bold text-red-600">{stat.overdue}</p>
                      <p className="text-[10px] text-red-400">Ritardo</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-bold text-green-600">{stat.completedThisWeek}</p>
                    <p className="text-[10px] text-gray-400">Sett.</p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
