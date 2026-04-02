'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/providers/AuthProvider'
import type { WorkSchedule } from '@/types'

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const

export function useWorkSchedule(userId?: string) {
  const { user } = useAuth()
  const targetUserId = userId || user?.id
  const [schedule, setSchedule] = useState<WorkSchedule | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchSchedule = useCallback(async () => {
    if (!targetUserId) return
    const supabase = createClient()

    const { data } = await supabase
      .from('todo_work_schedules')
      .select('*')
      .eq('user_id', targetUserId)
      .maybeSingle()

    if (data) {
      setSchedule(data as WorkSchedule)
    } else if (targetUserId === user?.id) {
      // Create default schedule for current user if doesn't exist
      const { data: newSchedule } = await supabase
        .from('todo_work_schedules')
        .insert({ user_id: targetUserId })
        .select()
        .single()
      if (newSchedule) setSchedule(newSchedule as WorkSchedule)
    }
    setLoading(false)
  }, [targetUserId, user?.id])

  useEffect(() => {
    fetchSchedule()
  }, [fetchSchedule])

  const saveSchedule = async (updates: Partial<WorkSchedule>) => {
    if (!targetUserId || targetUserId !== user?.id) return false
    const supabase = createClient()

    const { error } = await supabase
      .from('todo_work_schedules')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('user_id', targetUserId)

    if (!error) {
      setSchedule(prev => prev ? { ...prev, ...updates } : null)
      return true
    }
    return false
  }

  // Calculate weekly hours from schedule
  const getWeeklyMinutes = useCallback(() => {
    if (!schedule) return 0
    let total = 0
    for (const day of DAYS) {
      const start = schedule[`${day}_start` as keyof WorkSchedule] as string | null
      const end = schedule[`${day}_end` as keyof WorkSchedule] as string | null
      if (start && end) {
        const [sh, sm] = start.split(':').map(Number)
        const [eh, em] = end.split(':').map(Number)
        total += (eh * 60 + em) - (sh * 60 + sm)
      }
    }
    return total
  }, [schedule])

  return {
    schedule,
    loading,
    saveSchedule,
    getWeeklyMinutes,
    refetch: fetchSchedule,
  }
}
