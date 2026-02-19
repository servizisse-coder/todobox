'use client'

import { useState, useEffect } from 'react'
import { X, Search, UserPlus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/providers/AuthProvider'
import type { Profile } from '@/types'

interface AssignTaskModalProps {
  taskId: string
  open: boolean
  onClose: () => void
  onAssign: (taskId: string, userId: string) => Promise<boolean>
}

export function AssignTaskModal({ taskId, open, onClose, onAssign }: AssignTaskModalProps) {
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(false)
  const [assigning, setAssigning] = useState(false)

  useEffect(() => {
    if (!open || !user) return

    const fetchUsers = async () => {
      setLoading(true)
      const supabase = createClient()
      let query = supabase
        .from('profiles')
        .select('*')
        .neq('id', user.id)
        .order('full_name')
        .limit(20)

      if (search.trim()) {
        query = query.ilike('full_name', `%${search.trim()}%`)
      }

      const { data } = await query
      if (data) setUsers(data as Profile[])
      setLoading(false)
    }

    const debounce = setTimeout(fetchUsers, 300)
    return () => clearTimeout(debounce)
  }, [open, search, user])

  const handleAssign = async (userId: string) => {
    setAssigning(true)
    const success = await onAssign(taskId, userId)
    setAssigning(false)
    if (success) {
      onClose()
      setSearch('')
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900">Assegna task</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cerca utente..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>

          <div className="max-h-60 overflow-y-auto space-y-1">
            {loading && (
              <p className="text-sm text-gray-400 text-center py-4">Caricamento...</p>
            )}
            {!loading && users.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">Nessun utente trovato</p>
            )}
            {users.map((u) => (
              <button
                key={u.id}
                onClick={() => handleAssign(u.id)}
                disabled={assigning}
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors text-left disabled:opacity-50"
              >
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">
                  {u.full_name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{u.full_name}</p>
                  <p className="text-xs text-gray-500 truncate">{u.email}</p>
                </div>
                <UserPlus className="w-4 h-4 text-gray-400" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
