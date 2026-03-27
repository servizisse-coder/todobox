'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/providers/AuthProvider'
import { useToastStore } from '@/store/toastStore'
import type { TodoAssignment } from '@/types'

export function useAssignments() {
  const { user } = useAuth()
  const [assignedToMe, setAssignedToMe] = useState<TodoAssignment[]>([])
  const [assignedByMe, setAssignedByMe] = useState<TodoAssignment[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAssignments = useCallback(async () => {
    if (!user) return
    const supabase = createClient()

    const [toMeRes, byMeRes] = await Promise.all([
      supabase
        .from('todo_assignments')
        .select('*, task:todo_tasks(*, creator:profiles!todo_tasks_created_by_fkey(*)), sender:profiles!todo_assignments_from_user_fkey(*)')
        .eq('to_user', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('todo_assignments')
        .select('*, task:todo_tasks(*, assignee:profiles!todo_tasks_assigned_to_fkey(*)), recipient:profiles!todo_assignments_to_user_fkey(*)')
        .eq('from_user', user.id)
        .order('created_at', { ascending: false }),
    ])

    if (toMeRes.data) setAssignedToMe(toMeRes.data as TodoAssignment[])
    if (byMeRes.data) setAssignedByMe(byMeRes.data as TodoAssignment[])
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchAssignments()
  }, [fetchAssignments])

  useEffect(() => {
    if (!user) return
    const supabase = createClient()

    const channel = supabase
      .channel('todo-assignments-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'todo_assignments' },
        () => { fetchAssignments() }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user, fetchAssignments])

  const assignTask = async (taskId: string, toUserId: string) => {
    if (!user) return false
    const supabase = createClient()

    // BUG 2: Check for existing active assignment
    const { data: existing } = await supabase
      .from('todo_assignments')
      .select('id')
      .eq('task_id', taskId)
      .eq('to_user', toUserId)
      .in('status', ['pending', 'accepted'])
      .maybeSingle()

    if (existing) {
      useToastStore.getState().addToast('Task già assegnato a questo utente', 'info')
      return false
    }

    // Create assignment
    const { error: assignError } = await supabase.from('todo_assignments').insert({
      task_id: taskId,
      from_user: user.id,
      to_user: toUserId,
    })

    if (assignError) {
      useToastStore.getState().addToast('Errore nell\'assegnazione. Riprova.', 'error')
      return false
    }

    // Update task
    await supabase.from('todo_tasks').update({
      assigned_by: user.id,
      visibility: 'assigned',
    }).eq('id', taskId)

    // Create update entry
    await supabase.from('todo_updates').insert({
      task_id: taskId,
      user_id: user.id,
      update_type: 'assigned',
    })

    // Get recipient name + task title for feedback
    const [{ data: recipient }, { data: task }] = await Promise.all([
      supabase.from('profiles').select('full_name').eq('id', toUserId).single(),
      supabase.from('todo_tasks').select('title').eq('id', taskId).single(),
    ])

    // Notify recipient
    await supabase.from('todo_notifications').insert({
      user_id: toUserId,
      task_id: taskId,
      type: 'task_assigned',
      message: `Ti è stato assegnato il task "${task?.title || 'Nuovo task'}"`,
    })

    // BUG 2: Toast feedback
    useToastStore.getState().addToast(
      `Task assegnato a ${recipient?.full_name || 'utente'}`,
      'success'
    )

    await fetchAssignments()
    return true
  }

  const respondToAssignment = async (assignmentId: string, accept: boolean, declineReason?: string) => {
    if (!user) return false
    const supabase = createClient()

    const { data: assignment } = await supabase
      .from('todo_assignments')
      .select('*, task:todo_tasks(*)')
      .eq('id', assignmentId)
      .single()

    if (!assignment) return false

    // Update assignment
    await supabase.from('todo_assignments').update({
      status: accept ? 'accepted' : 'declined',
      decline_reason: declineReason || null,
      responded_at: new Date().toISOString(),
    }).eq('id', assignmentId)

    if (accept) {
      // BUG 1 FIX: Update task with assigned_to — now works thanks to new RLS policy
      await supabase.from('todo_tasks').update({
        assigned_to: user.id,
      }).eq('id', assignment.task_id)

      await supabase.from('todo_updates').insert({
        task_id: assignment.task_id,
        user_id: user.id,
        update_type: 'accepted',
      })
    } else {
      await supabase.from('todo_updates').insert({
        task_id: assignment.task_id,
        user_id: user.id,
        update_type: 'declined',
        content: declineReason || null,
      })
    }

    // Get task title AFTER assigned_to is set (so RLS allows the SELECT)
    const { data: taskData } = await supabase
      .from('todo_tasks')
      .select('title')
      .eq('id', assignment.task_id)
      .single()
    const taskTitle = taskData?.title || 'senza titolo'

    await supabase.from('todo_notifications').insert({
      user_id: assignment.from_user,
      task_id: assignment.task_id,
      type: accept ? 'task_accepted' : 'task_declined',
      message: accept
        ? `Il task "${taskTitle}" è stato accettato`
        : `Il task "${taskTitle}" è stato rifiutato${declineReason ? `: ${declineReason}` : ''}`,
    })

    await fetchAssignments()
    return true
  }

  // BUG 2: Revoke assignment
  const revokeAssignment = async (assignmentId: string) => {
    if (!user) return false
    const supabase = createClient()

    const { data: assignment } = await supabase
      .from('todo_assignments')
      .select('*, task:todo_tasks(*)')
      .eq('id', assignmentId)
      .single()

    if (!assignment || assignment.from_user !== user.id) return false

    const taskId = assignment.task_id
    const toUserId = assignment.to_user

    // Delete the assignment
    await supabase.from('todo_assignments').delete().eq('id', assignmentId)

    // Check if there are remaining active assignments for this task
    const { data: remaining } = await supabase
      .from('todo_assignments')
      .select('id')
      .eq('task_id', taskId)
      .in('status', ['pending', 'accepted'])

    if (!remaining || remaining.length === 0) {
      // No more active assignments — revert task to private
      await supabase.from('todo_tasks').update({
        visibility: 'private',
        assigned_to: null,
        assigned_by: null,
      }).eq('id', taskId)
    } else if (assignment.status === 'accepted') {
      // Revoked was the accepted one — clear assigned_to
      await supabase.from('todo_tasks').update({
        assigned_to: null,
      }).eq('id', taskId)
    }

    // Notify the recipient
    const taskObj = assignment.task
    const taskTitle = taskObj && typeof taskObj === 'object' && 'title' in taskObj
      ? (taskObj as { title: string }).title
      : 'senza titolo'

    await supabase.from('todo_notifications').insert({
      user_id: toUserId,
      task_id: taskId,
      type: 'task_updated',
      message: `L'assegnazione del task "${taskTitle}" è stata revocata`,
    })

    useToastStore.getState().addToast('Assegnazione revocata', 'success')
    await fetchAssignments()
    return true
  }

  return {
    assignedToMe,
    assignedByMe,
    loading,
    assignTask,
    respondToAssignment,
    revokeAssignment,
    refetch: fetchAssignments,
  }
}
