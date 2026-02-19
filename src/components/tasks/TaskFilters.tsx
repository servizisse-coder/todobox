'use client'

import { Search, X } from 'lucide-react'
import { useFilterStore } from '@/store/filterStore'
import type { TaskStatus, TaskPriority } from '@/types'

export function TaskFilters() {
  const { filters, setFilter, resetFilters } = useFilterStore()

  const hasActiveFilters =
    filters.status !== 'all' ||
    filters.priority !== 'all' ||
    filters.dueDate !== 'all' ||
    filters.search !== ''

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={filters.search}
          onChange={(e) => setFilter('search', e.target.value)}
          placeholder="Cerca task..."
          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Filter pills */}
      <div className="flex items-center gap-2 flex-wrap">
        <select
          value={filters.status}
          onChange={(e) => setFilter('status', e.target.value as TaskStatus | 'all')}
          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Tutti gli stati</option>
          <option value="todo">Da fare</option>
          <option value="in_progress">In corso</option>
          <option value="done">Completati</option>
          <option value="cancelled">Annullati</option>
        </select>

        <select
          value={filters.priority}
          onChange={(e) => setFilter('priority', e.target.value as TaskPriority | 'all')}
          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Tutte le priorità</option>
          <option value="high">Alta</option>
          <option value="medium">Media</option>
          <option value="low">Bassa</option>
        </select>

        <select
          value={filters.dueDate}
          onChange={(e) => setFilter('dueDate', e.target.value as typeof filters.dueDate)}
          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Tutte le scadenze</option>
          <option value="today">Oggi</option>
          <option value="this_week">Questa settimana</option>
          <option value="overdue">Scaduti</option>
          <option value="no_date">Senza scadenza</option>
        </select>

        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 px-2 py-1.5"
          >
            <X className="w-3 h-3" />
            Reset
          </button>
        )}
      </div>
    </div>
  )
}
