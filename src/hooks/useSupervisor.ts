'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/providers/AuthProvider'
import type { Profile, TodoTask } from '@/types'

export interface SupervisedUserStats {
  user: Profile
  totalOpen: number
  overdue: number
  completedThisWeek: number
  totalTasks: number
}

export function useSupervisor() {
  const { user } = useAuth()
  const [isSupervisor, setIsSupervisor] = useState(false)
  const [supervisedUsers, setSupervisedUsers] = useState<Profile[]>([])
  const [userStats, setUserStats] = useState<SupervisedUserStats[]>([])
  const [loading, setLoading] = useState(true)

  const fetchSupervisedUsers = useCallback(async () => {
    if (!user) return
    const supabase = createClient()

    // Check if current user is a supervisor
    const { data: access } = await supabase
      .from('todo_supervisor_access')
      .select('supervised_id')
      .eq('supervisor_id', user.id)

    if (!access || access.length === 0) {
      setIsSupervisor(false)
      setLoading(false)
      return
    }

    setIsSupervisor(true)
    const supervisedIds = access.map(a => a.supervised_id)

    // Fetch profiles of supervised users
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .in('id', supervisedIds)
      .order('full_name')

    if (profiles) {
      setSupervisedUsers(profiles as Profile[])
    }

    // Fetch ALL tasks for all supervised users in a single query
    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay() + 1) // Monday
    weekStart.setHours(0, 0, 0, 0)

    const { data: allTasks } = await supabase
      .from('todo_tasks')
      .select('id, status, due_date, completed_at, created_by')
      .in('created_by', supervisedIds)

    const tasksByUser = new Map<string, typeof allTasks>()
    for (const task of (allTasks || [])) {
      const list = tasksByUser.get(task.created_by) || []
      list.push(task)
      tasksByUser.set(task.created_by, list)
    }

    const stats: SupervisedUserStats[] = (profiles || []).map((profile) => {
      const userTasks = tasksByUser.get((profile as Profile).id) || []
      const openTasks = userTasks.filter(t => t.status !== 'done' && t.status !== 'cancelled')
      const overdueTasks = openTasks.filter(t => t.due_date && new Date(t.due_date) < now)
      const completedThisWeek = userTasks.filter(t =>
        t.status === 'done' && t.completed_at && new Date(t.completed_at) >= weekStart
      )
      return {
        user: profile as Profile,
        totalOpen: openTasks.length,
        overdue: overdueTasks.length,
        completedThisWeek: completedThisWeek.length,
        totalTasks: userTasks.length,
      }
    })
    setUserStats(stats)
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchSupervisedUsers()
  }, [fetchSupervisedUsers])

  const fetchUserTasks = useCallback(async (userId: string) => {
    if (!user) return []
    const supabase = createClient()

    const { data } = await supabase
      .from('todo_tasks')
      .select('*, role:todo_roles(*), creator:profiles!todo_tasks_created_by_fkey(*), assignee:profiles!todo_tasks_assigned_to_fkey(*)')
      .eq('created_by', userId)
      .order('created_at', { ascending: false })

    return (data || []) as TodoTask[]
  }, [user])

  return {
    isSupervisor,
    supervisedUsers,
    userStats,
    loading,
    fetchUserTasks,
    refetch: fetchSupervisedUsers,
  }
}
