'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/providers/AuthProvider'
import { useToastStore } from '@/store/toastStore'
import type { TodoFeedback, FeedbackType } from '@/types'

export function useFeedback() {
  const { user } = useAuth()
  const [feedback, setFeedback] = useState<TodoFeedback[]>([])
  const [loading, setLoading] = useState(true)

  const fetchFeedback = useCallback(async () => {
    if (!user) return
    const supabase = createClient()

    const { data, error } = await supabase
      .from('todo_feedback')
      .select('*, user:profiles!todo_feedback_user_id_fkey(*)')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setFeedback(data as TodoFeedback[])
    }
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchFeedback()
  }, [fetchFeedback])

  const createFeedback = async (type: FeedbackType, title: string, description?: string) => {
    if (!user) return false
    const supabase = createClient()

    const { error } = await supabase.from('todo_feedback').insert({
      user_id: user.id,
      type,
      title: title.trim(),
      description: description?.trim() || null,
    })

    if (error) {
      useToastStore.getState().addToast('Errore nell\'invio del feedback', 'error')
      return false
    }

    useToastStore.getState().addToast('Feedback inviato!', 'success')
    await fetchFeedback()
    return true
  }

  const respondToFeedback = async (feedbackId: string, status: string, response?: string) => {
    if (!user) return false
    const supabase = createClient()

    const { error } = await supabase.from('todo_feedback').update({
      status,
      admin_response: response || null,
      updated_at: new Date().toISOString(),
    }).eq('id', feedbackId)

    if (error) {
      useToastStore.getState().addToast('Errore nell\'aggiornamento', 'error')
      return false
    }

    await fetchFeedback()
    return true
  }

  return {
    feedback,
    loading,
    createFeedback,
    respondToFeedback,
    refetch: fetchFeedback,
  }
}
