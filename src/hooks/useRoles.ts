'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/providers/AuthProvider'
import type { TodoRole } from '@/types'
import { useToastStore } from '@/store/toastStore'

export function useRoles() {
  const { user } = useAuth()
  const [roles, setRoles] = useState<TodoRole[]>([])
  const [loading, setLoading] = useState(true)

  const fetchRoles = useCallback(async () => {
    if (!user) return
    const supabase = createClient()

    const { data, error } = await supabase
      .from('todo_roles')
      .select('*')
      .eq('user_id', user.id)
      .order('sort_order', { ascending: true })

    if (!error && data) {
      setRoles(data as TodoRole[])
    }
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchRoles()
  }, [fetchRoles])

  // Realtime subscription
  useEffect(() => {
    if (!user) return
    const supabase = createClient()

    const channel = supabase
      .channel('todo-roles-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'todo_roles', filter: `user_id=eq.${user.id}` },
        () => { fetchRoles() }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user, fetchRoles])

  const createRole = async (name: string, color: string) => {
    if (!user) return null
    const supabase = createClient()

    const maxOrder = roles.length > 0 ? Math.max(...roles.map(r => r.sort_order)) + 1 : 0

    const { data, error } = await supabase
      .from('todo_roles')
      .insert({
        user_id: user.id,
        name,
        color,
        sort_order: maxOrder,
      })
      .select()
      .single()

    if (error) {
      useToastStore.getState().addToast('Errore nella creazione del ruolo', 'error')
      return null
    }

    await fetchRoles()
    return data
  }

  const updateRole = async (id: string, updates: { name?: string; color?: string }) => {
    const supabase = createClient()

    const { error } = await supabase
      .from('todo_roles')
      .update(updates)
      .eq('id', id)

    if (error) {
      useToastStore.getState().addToast('Errore nell\'aggiornamento del ruolo', 'error')
      return false
    }

    await fetchRoles()
    return true
  }

  const deleteRole = async (id: string) => {
    const supabase = createClient()

    const { error } = await supabase
      .from('todo_roles')
      .delete()
      .eq('id', id)

    if (error) {
      useToastStore.getState().addToast('Errore nell\'eliminazione del ruolo', 'error')
      return false
    }

    await fetchRoles()
    return true
  }

  const setDefaultRole = async (id: string) => {
    if (!user) return false
    const supabase = createClient()

    // Remove default from all roles
    await supabase
      .from('todo_roles')
      .update({ is_default: false })
      .eq('user_id', user.id)

    // Set the new default
    const { error } = await supabase
      .from('todo_roles')
      .update({ is_default: true })
      .eq('id', id)

    if (error) {
      useToastStore.getState().addToast('Errore nell\'impostazione del ruolo predefinito', 'error')
      return false
    }

    await fetchRoles()
    return true
  }

  const reorderRoles = async (reorderedRoles: TodoRole[]) => {
    const supabase = createClient()

    // Optimistic update
    setRoles(reorderedRoles)

    const updates = reorderedRoles.map((role, index) => ({
      id: role.id,
      user_id: role.user_id,
      name: role.name,
      color: role.color,
      sort_order: index,
    }))

    const { error } = await supabase
      .from('todo_roles')
      .upsert(updates)

    if (error) {
      useToastStore.getState().addToast('Errore nel riordinamento', 'error')
      await fetchRoles()
    }
  }

  return {
    roles,
    loading,
    createRole,
    updateRole,
    deleteRole,
    setDefaultRole,
    reorderRoles,
    refetch: fetchRoles,
  }
}
