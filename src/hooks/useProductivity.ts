'use client'

import { useMemo } from 'react'
import { isToday, parseISO } from 'date-fns'
import type { TodoTask } from '@/types'

export function useProductivity(tasks: TodoTask[]) {
  return useMemo(() => {
    const todayTasks = tasks.filter((t) => {
      const dueToday = t.due_date && isToday(parseISO(t.due_date))
      const createdToday = isToday(parseISO(t.created_at))
      return dueToday || createdToday
    })

    const completed = todayTasks.filter((t) => t.status === 'done').length
    const total = todayTasks.length

    return { completed, total }
  }, [tasks])
}
