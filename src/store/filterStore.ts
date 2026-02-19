import { create } from 'zustand'
import type { TaskFilters } from '@/types'

interface FilterState {
  filters: TaskFilters
  setFilter: <K extends keyof TaskFilters>(key: K, value: TaskFilters[K]) => void
  resetFilters: () => void
}

const defaultFilters: TaskFilters = {
  status: 'all',
  priority: 'all',
  type: 'all',
  dueDate: 'all',
  search: '',
}

export const useFilterStore = create<FilterState>((set) => ({
  filters: { ...defaultFilters },
  setFilter: (key, value) =>
    set((state) => ({
      filters: { ...state.filters, [key]: value },
    })),
  resetFilters: () => set({ filters: { ...defaultFilters } }),
}))
