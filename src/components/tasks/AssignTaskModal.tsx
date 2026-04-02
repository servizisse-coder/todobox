'use client'

import { useState, useEffect } from 'react'
import { X, Search, UserPlus, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/providers/AuthProvider'
import type { Profile, TodoRole } from '@/types'

interface AssignTaskModalProps {
  taskId: string
  open: boolean
  onClose: () => void
  onAssign: (taskId: string, userId: string, roleId?: string) => Promise<boolean>
}

export function AssignTaskModal({ taskId, open, onClose, onAssign }: AssignTaskModalProps) {
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(false)
  const [assigning, setAssigning] = useState(false)
  // Step 2: role selection
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null)
  const [userRoles, setUserRoles] = useState<TodoRole[]>([])
  const [loadingRoles, setLoadingRoles] = useState(false)

  // Fetch users
  useEffect(() => {
    if (!open || !user || selectedUser) return

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
  }, [open, search, user, selectedUser])

  // Fetch roles of selected user
  useEffect(() => {
    if (!selectedUser) return

    const fetchRoles = async () => {
      setLoadingRoles(true)
      const supabase = createClient()
      const { data } = await supabase
        .from('todo_roles')
        .select('*')
        .eq('user_id', selectedUser.id)
        .order('sort_order', { ascending: true })

      if (data) setUserRoles(data as TodoRole[])
      setLoadingRoles(false)
    }
    fetchRoles()
  }, [selectedUser])

  const handleSelectUser = (u: Profile) => {
    setSelectedUser(u)
  }

  const handleAssign = async (roleId?: string) => {
    if (!selectedUser) return
    setAssigning(true)
    const success = await onAssign(taskId, selectedUser.id, roleId)
    setAssigning(false)
    if (success) {
      handleReset()
      onClose()
    }
  }

  const handleReset = () => {
    setSelectedUser(null)
    setUserRoles([])
    setSearch('')
  }

  const handleClose = () => {
    handleReset()
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/30" onClick={handleClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          {selectedUser ? (
            <div className="flex items-center gap-2">
              <button onClick={handleReset} className="p-1 rounded hover:bg-gray-100">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h2 className="text-sm font-semibold text-gray-900">Scegli ruolo per {selectedUser.full_name}</h2>
            </div>
          ) : (
            <h2 className="text-sm font-semibold text-gray-900">Assegna task</h2>
          )}
          <button onClick={handleClose} className="p-1 rounded hover:bg-gray-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4">
          {!selectedUser ? (
            /* Step 1: Select user */
            <>
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
                    onClick={() => handleSelectUser(u)}
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors text-left"
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
            </>
          ) : (
            /* Step 2: Select role */
            <div className="space-y-3">
              <div className="flex items-center gap-3 bg-blue-50 rounded-lg p-3">
                <div className="w-8 h-8 rounded-full bg-blue-200 text-blue-700 flex items-center justify-center text-sm font-bold">
                  {selectedUser.full_name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-900">{selectedUser.full_name}</p>
                  <p className="text-xs text-blue-600">{selectedUser.email}</p>
                </div>
              </div>

              {loadingRoles ? (
                <p className="text-sm text-gray-400 text-center py-4">Caricamento ruoli...</p>
              ) : userRoles.length === 0 ? (
                <div className="text-center py-3">
                  <p className="text-sm text-gray-500 mb-3">Questo utente non ha ruoli configurati</p>
                  <button
                    onClick={() => handleAssign()}
                    disabled={assigning}
                    className="w-full py-2.5 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 disabled:opacity-50"
                  >
                    {assigning ? 'Assegnazione...' : 'Assegna senza ruolo'}
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-gray-500 font-medium">Per quale ruolo?</p>
                  {userRoles.map((role) => (
                    <button
                      key={role.id}
                      onClick={() => handleAssign(role.id)}
                      disabled={assigning}
                      className="w-full flex items-center gap-3 p-2.5 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors text-left disabled:opacity-50"
                    >
                      <div
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: role.color }}
                      />
                      <span className="text-sm font-medium text-gray-900">{role.name}</span>
                    </button>
                  ))}
                  <button
                    onClick={() => handleAssign()}
                    disabled={assigning}
                    className="w-full py-2 text-xs text-gray-400 hover:text-gray-600"
                  >
                    Assegna senza ruolo specifico
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
