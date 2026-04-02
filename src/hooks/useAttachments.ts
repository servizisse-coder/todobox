'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/providers/AuthProvider'
import { useToastStore } from '@/store/toastStore'
import type { TodoAttachment } from '@/types'

export function useAttachments(taskId: string) {
  const { user } = useAuth()
  const [attachments, setAttachments] = useState<TodoAttachment[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  const fetchAttachments = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('todo_attachments')
      .select('*, user:profiles!todo_attachments_user_id_fkey(*)')
      .eq('task_id', taskId)
      .order('created_at', { ascending: false })

    if (data) setAttachments(data as TodoAttachment[])
    setLoading(false)
  }, [taskId])

  useEffect(() => {
    fetchAttachments()
  }, [fetchAttachments])

  const uploadFile = async (file: File) => {
    if (!user) return false
    setUploading(true)
    const supabase = createClient()

    const filePath = `${user.id}/${taskId}/${Date.now()}_${file.name}`

    const { error: uploadError } = await supabase.storage
      .from('task-attachments')
      .upload(filePath, file)

    if (uploadError) {
      useToastStore.getState().addToast('Errore nel caricamento del file', 'error')
      setUploading(false)
      return false
    }

    const { error: dbError } = await supabase.from('todo_attachments').insert({
      task_id: taskId,
      user_id: user.id,
      file_name: file.name,
      file_path: filePath,
      file_size: file.size,
      mime_type: file.type || null,
    })

    if (dbError) {
      useToastStore.getState().addToast('Errore nel salvataggio allegato', 'error')
      setUploading(false)
      return false
    }

    useToastStore.getState().addToast('File allegato', 'success')
    await fetchAttachments()
    setUploading(false)
    return true
  }

  const deleteAttachment = async (attachmentId: string, filePath: string) => {
    const supabase = createClient()

    await supabase.storage.from('task-attachments').remove([filePath])
    await supabase.from('todo_attachments').delete().eq('id', attachmentId)

    setAttachments(prev => prev.filter(a => a.id !== attachmentId))
    useToastStore.getState().addToast('Allegato rimosso', 'success')
  }

  const getFileUrl = async (filePath: string) => {
    const supabase = createClient()
    const { data } = await supabase.storage
      .from('task-attachments')
      .createSignedUrl(filePath, 3600) // 1 hour

    return data?.signedUrl || null
  }

  return {
    attachments,
    loading,
    uploading,
    uploadFile,
    deleteAttachment,
    getFileUrl,
  }
}
