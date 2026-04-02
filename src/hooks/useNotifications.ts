'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/providers/AuthProvider'
import type { TodoNotification } from '@/types'

const PAGE_SIZE = 20

export function useNotifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<TodoNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)

  const fetchNotifications = useCallback(async (reset = true) => {
    if (!user) return
    const supabase = createClient()

    const offset = reset ? 0 : notifications.length

    const { data } = await supabase
      .from('todo_notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1)

    if (data) {
      if (reset) {
        setNotifications(data as TodoNotification[])
      } else {
        setNotifications(prev => [...prev, ...(data as TodoNotification[])])
      }
      setHasMore(data.length === PAGE_SIZE)
    }
    setLoading(false)
  }, [user, notifications.length])

  useEffect(() => {
    fetchNotifications(true)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  useEffect(() => {
    if (!user) return
    const supabase = createClient()

    const channel = supabase
      .channel('todo-notifications-list')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'todo_notifications', filter: `user_id=eq.${user.id}` },
        () => { fetchNotifications(true) }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchNotifications(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    const supabase = createClient()
    await supabase.from('todo_notifications').update({ is_read: true }).eq('id', notificationId)
    setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n))
  }

  const markAllAsRead = async () => {
    if (!user) return
    const supabase = createClient()
    await supabase.from('todo_notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  return {
    notifications,
    loading,
    hasMore,
    loadMore,
    markAsRead,
    markAllAsRead,
    refetch: () => fetchNotifications(true),
  }
}
