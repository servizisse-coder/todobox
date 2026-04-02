import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { TaskFilters } from '@/types'

interface ViewPreferences {
  showRoleBadge: boolean
  showDueDateBadge: boolean
  showPriorityBadge: boolean
  showAssignment: boolean
}

interface FilterState {
  filters: TaskFilters
  viewPrefs: ViewPreferences
  setFilter: <K extends keyof TaskFilters>(key: K, value: TaskFilters[K]) => void
  resetFilters: () => void
  setViewPref: <K extends keyof ViewPreferences>(key: K, value: boolean) => void
}

const defaultFilters: TaskFilters = {
  status: 'all',
  priority: 'all',
  type: 'all',
  dueDate: 'all',
  role: 'all',
  sortBy: 'urgency',
  urgentOnly: false,
  visibility: 'all',
  referent: 'all',
  company: 'all',
  search: '',
}

const defaultViewPrefs: ViewPreferences = {
  showRoleBadge: true,
  showDueDateBadge: true,
  showPriorityBadge: true,
  showAssignment: true,
}

export const useFilterStore = create<FilterState>()(
  persist(
    (set) => ({
      filters: { ...defaultFilters },
      viewPrefs: { ...defaultViewPrefs },
      setFilter: (key, value) =>
        set((state) => ({
          filters: { ...state.filters, [key]: value },
        })),
      resetFilters: () => set({ filters: { ...defaultFilters } }),
      setViewPref: (key, value) =>
        set((state) => ({
          viewPrefs: { ...state.viewPrefs, [key]: value },
        })),
    }),
    {
      name: 'todobox-filters',
      partialize: (state) => ({ viewPrefs: state.viewPrefs }),
    }
  )
)
