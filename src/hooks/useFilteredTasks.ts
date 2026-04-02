'use client'

import { useMemo } from 'react'
import { isToday, isPast, parseISO, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns'
import { useAuth } from '@/components/providers/AuthProvider'
import type { TodoTask, TaskFilters } from '@/types'

/**
 * Filter tasks for "my work queue" — excludes delegated tasks
 */
export function useMyWorkQueue(tasks: TodoTask[]) {
  const { user } = useAuth()

  return useMemo(() => {
    if (!user) return []
    return tasks.filter(t => {
      // Delegated: I created it but someone else is assigned → exclude
      if (t.created_by === user.id && t.assigned_to && t.assigned_to !== user.id) return false
      // Include: my own tasks, tasks assigned to me, tasks I claimed
      return t.created_by === user.id || t.assigned_to === user.id || t.claimed_by === user.id
    })
  }, [tasks, user])
}

/**
 * Filter tasks for "archive view" — all tasks created by user, with full filters + sorting
 */
export function useArchiveFilters(tasks: TodoTask[], filters: TaskFilters) {
  const { user } = useAuth()

  return useMemo(() => {
    if (!user) return []
    let result = tasks.filter(t => t.created_by === user.id)

    if (filters.status !== 'all') {
      result = result.filter(t => t.status === filters.status)
    }
    if (filters.priority !== 'all') {
      result = result.filter(t => t.priority === filters.priority)
    }
    if (filters.type !== 'all') {
      switch (filters.type) {
        case 'personal':
          result = result.filter(t => t.visibility === 'private' && t.created_by === user.id)
          break
        case 'assigned_to_me':
          result = result.filter(t => t.assigned_to === user.id)
          break
        case 'assigned_by_me':
          result = result.filter(t => t.assigned_by === user.id)
          break
        case 'public':
          result = result.filter(t => t.visibility === 'public')
          break
      }
    }
    if (filters.dueDate !== 'all') {
      const now = new Date()
      const weekStart = startOfWeek(now, { weekStartsOn: 1 })
      const weekEnd = endOfWeek(now, { weekStartsOn: 1 })
      result = result.filter(t => {
        if (filters.dueDate === 'no_date') return !t.due_date
        if (!t.due_date) return false
        const d = parseISO(t.due_date)
        switch (filters.dueDate) {
          case 'today': return isToday(d)
          case 'this_week': return isWithinInterval(d, { start: weekStart, end: weekEnd })
          case 'overdue': return isPast(d) && !isToday(d) && t.status !== 'done'
          default: return true
        }
      })
    }
    if (filters.role !== 'all') {
      result = result.filter(t => t.role_id === filters.role)
    }
    if (filters.visibility !== 'all') {
      result = result.filter(t => t.visibility === filters.visibility)
    }
    if (filters.referent) {
      result = result.filter(t => t.referent?.toLowerCase().includes(filters.referent.toLowerCase()))
    }
    if (filters.company) {
      result = result.filter(t => t.company?.toLowerCase().includes(filters.company.toLowerCase()))
    }
    if (filters.search) {
      const q = filters.search.toLowerCase()
      result = result.filter(t => t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q))
    }

    // Sort
    const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 }
    return result.sort((a, b) => {
      if (a.status === 'done' && b.status !== 'done') return 1
      if (a.status !== 'done' && b.status === 'done') return -1
      switch (filters.sortBy) {
        case 'due_date':
          if (!a.due_date && !b.due_date) return 0
          if (!a.due_date) return 1
          if (!b.due_date) return -1
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
        case 'priority':
          return (priorityOrder[a.priority] ?? 1) - (priorityOrder[b.priority] ?? 1)
        case 'created':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'role': {
          const aRole = a.role?.name || 'zzz'
          const bRole = b.role?.name || 'zzz'
          if (aRole !== bRole) return aRole.localeCompare(bRole)
          return (priorityOrder[a.priority] ?? 1) - (priorityOrder[b.priority] ?? 1)
        }
        default:
          return (priorityOrder[a.priority] ?? 1) - (priorityOrder[b.priority] ?? 1)
      }
    })
  }, [tasks, filters, user])
}

/**
 * Derive autocomplete suggestions from tasks
 */
export function useTaskSuggestions(tasks: TodoTask[]) {
  const referentSuggestions = useMemo(() =>
    [...new Set(tasks.filter(t => t.referent).map(t => t.referent!))].sort()
  , [tasks])

  const companySuggestions = useMemo(() =>
    [...new Set(tasks.filter(t => t.company).map(t => t.company!))].sort()
  , [tasks])

  return { referentSuggestions, companySuggestions }
}
