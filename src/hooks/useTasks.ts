'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/providers/AuthProvider'
import type { TodoTask, TaskStatus, TaskPriority, TaskVisibility, RecurrenceType, TodoRole } from '@/types'
import { addDays, addWeeks, addMonths } from 'date-fns'
import { useToastStore } from '@/store/toastStore'

export function useTasks() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<TodoTask[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTasks = useCallback(async () => {
    if (!user) return
    const supabase = createClient()

    const { data, error } = await supabase
      .from('todo_tasks')
      .select('*, role:todo_roles(*), creator:profiles!todo_tasks_created_by_fkey(*), assignee:profiles!todo_tasks_assigned_to_fkey(*), assigner:profiles!todo_tasks_assigned_by_fkey(*), claimer:profiles!todo_tasks_claimed_by_fkey(*)')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setTasks(data as TodoTask[])
    }
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  useEffect(() => {
    if (!user) return
    const supabase = createClient()

    const channel = supabase
      .channel('todo-tasks-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'todo_tasks' },
        () => { fetchTasks() }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user, fetchTasks])

  const createTask = async (data: {
    title: string
    description?: string
    priority?: TaskPriority
    visibility?: TaskVisibility
    due_date?: string | null
    is_recurring?: boolean
    recurrence_type?: RecurrenceType | null
    recurrence_interval?: number | null
    role_id?: string | null
    referent?: string | null
    company?: string | null
    assigned_by?: string | null
  }) => {
    if (!user) return null
    const supabase = createClient()

    const { data: task, error } = await supabase
      .from('todo_tasks')
      .insert({
        title: data.title,
        description: data.description || null,
        priority: data.priority || 'medium',
        visibility: data.visibility || 'private',
        due_date: data.due_date || null,
        is_recurring: data.is_recurring || false,
        recurrence_type: data.recurrence_type || null,
        recurrence_interval: data.recurrence_interval || null,
        role_id: data.role_id || null,
        referent: data.referent || null,
        company: data.company || null,
        assigned_by: data.assigned_by || null,
        created_by: user.id,
      })
      .select()
      .single()

    if (!error && task) {
      await fetchTasks()
      return task
    }
    return null
  }

  const updateTask = async (taskId: string, updates: Partial<TodoTask>) => {
    const supabase = createClient()

    const { error } = await supabase
      .from('todo_tasks')
      .update(updates)
      .eq('id', taskId)

    if (!error) {
      await fetchTasks()
    }
    return !error
  }

  const toggleStatus = async (task: TodoTask) => {
    if (!user) return

    const supabase = createClient()
    const newStatus: TaskStatus = task.status === 'done' ? 'todo' : 'done'
    const now = new Date().toISOString()

    const updates: Partial<TodoTask> = {
      status: newStatus,
      completed_at: newStatus === 'done' ? now : null,
    }

    // Aggiornamento ottimistico
    setTasks(prev => prev.map(t =>
      t.id === task.id ? { ...t, status: newStatus, completed_at: newStatus === 'done' ? now : null } : t
    ))

    const { error } = await supabase.from('todo_tasks').update(updates).eq('id', task.id)

    if (error) {
      setTasks(prev => prev.map(t =>
        t.id === task.id ? { ...t, status: task.status, completed_at: task.completed_at } : t
      ))
      useToastStore.getState().addToast('Errore nel cambio stato', 'error')
      return
    }

    useToastStore.getState().addToast(
      newStatus === 'done' ? 'Task completato' : 'Task riaperto',
      'success'
    )

    // Add auto update entry
    await supabase.from('todo_updates').insert({
      task_id: task.id,
      user_id: user.id,
      update_type: 'status_change',
      old_value: task.status,
      new_value: newStatus,
    })

    // Create notification for related users
    if (task.assigned_by && task.assigned_by !== user.id) {
      await supabase.from('todo_notifications').insert({
        user_id: task.assigned_by,
        task_id: task.id,
        type: newStatus === 'done' ? 'task_completed' : 'task_updated',
        message: newStatus === 'done'
          ? `Il task "${task.title}" è stato completato`
          : `Lo stato del task "${task.title}" è cambiato`,
      })
    }

    // Handle recurring task: create next occurrence
    if (newStatus === 'done' && task.is_recurring && task.recurrence_type) {
      const baseDate = task.due_date ? new Date(task.due_date) : new Date()
      let nextDate: Date

      switch (task.recurrence_type) {
        case 'daily':
          nextDate = addDays(baseDate, 1)
          break
        case 'weekly':
          nextDate = addWeeks(baseDate, 1)
          break
        case 'monthly':
          nextDate = addMonths(baseDate, 1)
          break
        case 'custom':
          nextDate = addDays(baseDate, task.recurrence_interval || 1)
          break
        default:
          nextDate = addDays(baseDate, 1)
      }

      const { data: newRecurringTask } = await supabase.from('todo_tasks').insert({
        title: task.title,
        description: task.description,
        priority: task.priority,
        visibility: task.visibility,
        due_date: nextDate.toISOString(),
        is_recurring: true,
        recurrence_type: task.recurrence_type,
        recurrence_interval: task.recurrence_interval,
        role_id: task.role_id,
        referent: task.referent,
        company: task.company,
        created_by: task.created_by,
      }).select().single()

      // Notifica il creatore della nuova occorrenza se diverso dall'utente corrente
      if (newRecurringTask && task.created_by !== user.id) {
        await supabase.from('todo_notifications').insert({
          user_id: task.created_by,
          task_id: newRecurringTask.id,
          type: 'task_assigned',
          message: `Nuova occorrenza ricorrente: "${task.title}"`,
        })
      }
    }

    await fetchTasks()
  }

  const startTask = async (task: TodoTask) => {
    if (!user) return
    const supabase = createClient()
    const now = new Date().toISOString()

    // Aggiornamento ottimistico
    setTasks(prev => prev.map(t =>
      t.id === task.id ? { ...t, status: 'in_progress' as TaskStatus, started_at: now } : t
    ))

    const { error } = await supabase.from('todo_tasks').update({
      status: 'in_progress',
      started_at: now,
    }).eq('id', task.id)

    if (error) {
      setTasks(prev => prev.map(t =>
        t.id === task.id ? { ...t, status: task.status, started_at: task.started_at } : t
      ))
      useToastStore.getState().addToast('Errore nell\'avvio del task', 'error')
      return
    }

    useToastStore.getState().addToast('Task avviato', 'success')

    await supabase.from('todo_updates').insert({
      task_id: task.id,
      user_id: user.id,
      update_type: 'status_change',
      old_value: task.status,
      new_value: 'in_progress',
    })

    if (task.assigned_by && task.assigned_by !== user.id) {
      await supabase.from('todo_notifications').insert({
        user_id: task.assigned_by,
        task_id: task.id,
        type: 'task_updated',
        message: `Il task "${task.title}" è stato avviato`,
      })
    }

    await fetchTasks()
  }

  const updatePriority = async (task: TodoTask, newPriority: TaskPriority) => {
    if (!user) return
    const supabase = createClient()

    // Aggiornamento ottimistico
    setTasks(prev => prev.map(t =>
      t.id === task.id ? { ...t, priority: newPriority } : t
    ))

    const { error } = await supabase.from('todo_tasks').update({ priority: newPriority }).eq('id', task.id)

    if (error) {
      setTasks(prev => prev.map(t =>
        t.id === task.id ? { ...t, priority: task.priority } : t
      ))
      useToastStore.getState().addToast('Errore nel cambio priorità', 'error')
      return
    }

    const labels: Record<string, string> = { high: 'alta', medium: 'media', low: 'bassa' }
    useToastStore.getState().addToast(`Priorità: ${labels[newPriority] || newPriority}`, 'success')

    await supabase.from('todo_updates').insert({
      task_id: task.id,
      user_id: user.id,
      update_type: 'priority_change',
      old_value: task.priority,
      new_value: newPriority,
    })

    await fetchTasks()
  }

  const deleteTask = async (taskId: string) => {
    const supabase = createClient()

    // Aggiornamento ottimistico — nascondi dalla UI
    const deletedTask = tasks.find(t => t.id === taskId)
    setTasks(prev => prev.filter(t => t.id !== taskId))

    // Delayed delete — 5 secondi per annullare
    let cancelled = false
    const timer = setTimeout(async () => {
      if (cancelled) return
      const { error } = await supabase.from('todo_tasks').delete().eq('id', taskId)
      if (error) {
        // Ripristina se il delete fallisce
        if (deletedTask) setTasks(prev => [...prev, deletedTask])
        useToastStore.getState().addToast('Errore nell\'eliminazione del task', 'error')
      }
    }, 5000)

    useToastStore.getState().addToast('Task eliminato', 'info', {
      label: 'Annulla',
      onClick: () => {
        cancelled = true
        clearTimeout(timer)
        if (deletedTask) setTasks(prev => [...prev, deletedTask])
      },
    })

    return true
  }

  const claimTask = async (task: TodoTask) => {
    if (!user) return
    const supabase = createClient()
    const now = new Date().toISOString()

    // Aggiornamento ottimistico
    setTasks(prev => prev.map(t =>
      t.id === task.id ? { ...t, claimed_by: user.id, claimed_at: now } : t
    ))

    const { error } = await supabase.from('todo_tasks').update({
      claimed_by: user.id,
      claimed_at: now,
    }).eq('id', task.id)

    if (error) {
      setTasks(prev => prev.map(t =>
        t.id === task.id ? { ...t, claimed_by: task.claimed_by, claimed_at: task.claimed_at } : t
      ))
      useToastStore.getState().addToast('Errore nella presa in carico', 'error')
      return
    }

    useToastStore.getState().addToast('Task preso in carico', 'success')

    await supabase.from('todo_updates').insert({
      task_id: task.id,
      user_id: user.id,
      update_type: 'claimed',
    })

    // Notify creator
    if (task.created_by !== user.id) {
      await supabase.from('todo_notifications').insert({
        user_id: task.created_by,
        task_id: task.id,
        type: 'task_claimed',
        message: `Un utente ha preso in carico il task "${task.title}"`,
      })
    }

    await fetchTasks()
  }

  return {
    tasks,
    loading,
    createTask,
    updateTask,
    toggleStatus,
    startTask,
    updatePriority,
    deleteTask,
    claimTask,
    refetch: fetchTasks,
  }
}
