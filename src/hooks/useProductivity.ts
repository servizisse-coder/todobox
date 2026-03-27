'use client'

import { useMemo } from 'react'
import { isToday, parseISO } from 'date-fns'
import type { TodoTask } from '@/types'
import { useAuth } from '@/components/providers/AuthProvider'

export function useProductivity(tasks: TodoTask[]) {
  const { user } = useAuth()

  return useMemo(() => {
    const userId = user?.id

    const todayTasks = tasks.filter((t) => {
      const dueToday = t.due_date && isToday(parseISO(t.due_date))
      const createdToday = isToday(parseISO(t.created_at))
      return dueToday || createdToday
    })

    const completed = todayTasks.filter((t) => t.status === 'done').length
    const total = todayTasks.length

    // Completed by me: tasks I completed today (I'm the assignee, or it's my own task)
    const completedByMe = tasks.filter((t) => {
      if (t.status !== 'done' || !t.completed_at) return false
      if (!isToday(parseISO(t.completed_at))) return false
      // My task if I'm assigned_to, or if no assignee and I'm the creator
      return t.assigned_to === userId || (!t.assigned_to && t.created_by === userId)
    }).length

    // Delegated completed: tasks I assigned that others completed today
    const delegatedCompleted = tasks.filter((t) => {
      if (t.status !== 'done' || !t.completed_at) return false
      if (!isToday(parseISO(t.completed_at))) return false
      return t.assigned_by === userId && t.assigned_to !== userId
    }).length

    return { completed, total, completedByMe, delegatedCompleted }
  }, [tasks, user])
}
