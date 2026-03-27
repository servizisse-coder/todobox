'use client'

import { AlertTriangle } from 'lucide-react'
import type { TodoRole } from '@/types'
import { ProgressBar } from '@/components/ui/ProgressBar'

interface RoleStats {
  completed: number
  open: number
  overdue: number
}

interface RoleReviewCardProps {
  role: TodoRole
  stats: RoleStats
  inactive: boolean
  onClick: () => void
}

export function RoleReviewCard({ role, stats, inactive, onClick }: RoleReviewCardProps) {
  const total = stats.completed + stats.open
  const progress = total > 0 ? Math.round((stats.completed / total) * 100) : 0

  return (
    <button
      onClick={onClick}
      className={`w-full text-left bg-white border rounded-xl p-4 transition-all hover:shadow-sm ${
        inactive ? 'opacity-50 border-gray-100' : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: role.color }}
        />
        <span className="font-medium text-gray-900 text-sm">{role.name}</span>
        {inactive && (
          <span className="ml-auto text-xs text-amber-500 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            Nessuna attivita
          </span>
        )}
      </div>

      {!inactive && (
        <>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div>
              <div className="text-lg font-bold text-green-600">{stats.completed}</div>
              <div className="text-[10px] text-gray-400 uppercase tracking-wide">Completati</div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-600">{stats.open}</div>
              <div className="text-[10px] text-gray-400 uppercase tracking-wide">Aperti</div>
            </div>
            <div>
              <div className={`text-lg font-bold ${stats.overdue > 0 ? 'text-red-600' : 'text-gray-300'}`}>
                {stats.overdue}
              </div>
              <div className="text-[10px] text-gray-400 uppercase tracking-wide">Scaduti</div>
            </div>
          </div>
          <ProgressBar value={stats.completed} max={total} />
        </>
      )}
    </button>
  )
}
