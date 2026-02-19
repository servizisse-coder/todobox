'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/providers/AuthProvider'
import type { TodoUpdate } from '@/types'

export function useTaskUpdates(taskId: string) {
  const { user } = useAuth()
  const [updates, setUpdates] = useState<TodoUpdate[]>([])
  const [loading, setLoading] = useState(true)

  const fetchUpdates = useCallback(async () => {
    if (!user || !taskId) return
    const supabase = createClient()

    const { data } = await supabase
      .from('todo_updates')
      .select('*, user:profiles(*)')
      .eq('task_id', taskId)
      .order('created_at', { ascending: true })

    if (data) setUpdates(data as TodoUpdate[])
    setLoading(false)
  }, [user, taskId])

  useEffect(() => {
    fetchUpdates()
  }, [fetchUpdates])

  const addNote = async (content: string) => {
    if (!user || !taskId) return false
    const supabase = createClient()

    const { error } = await supabase.from('todo_updates').insert({
      task_id: taskId,
      user_id: user.id,
      content,
      update_type: 'note',
    })

    if (!error) await fetchUpdates()
    return !error
  }

  return { updates, loading, addNote, refetch: fetchUpdates }
}
