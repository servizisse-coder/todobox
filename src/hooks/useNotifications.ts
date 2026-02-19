'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/providers/AuthProvider'
import type { TodoNotification } from '@/types'

export function useNotifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<TodoNotification[]>([])
  const [loading, setLoading] = useState(true)

  const fetchNotifications = useCallback(async () => {
    if (!user) return
    const supabase = createClient()

    const { data } = await supabase
      .from('todo_notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (data) setNotifications(data as TodoNotification[])
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  useEffect(() => {
    if (!user) return
    const supabase = createClient()

    const channel = supabase
      .channel('todo-notifications-list')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'todo_notifications', filter: `user_id=eq.${user.id}` },
        () => { fetchNotifications() }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user, fetchNotifications])

  const markAsRead = async (notificationId: string) => {
    const supabase = createClient()
    await supabase.from('todo_notifications').update({ is_read: true }).eq('id', notificationId)
    await fetchNotifications()
  }

  const markAllAsRead = async () => {
    if (!user) return
    const supabase = createClient()
    await supabase.from('todo_notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false)
    await fetchNotifications()
  }

  return {
    notifications,
    loading,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
  }
}
