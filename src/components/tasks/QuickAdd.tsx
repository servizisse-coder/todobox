'use client'

import { useState, useRef, useEffect } from 'react'
import { Plus, Calendar, UserPlus, X } from 'lucide-react'
import { addDays, nextMonday, format } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/providers/AuthProvider'
import type { TodoRole, Profile } from '@/types'

interface QuickAddProps {
  onAdd: (title: string, roleId?: string, dueDate?: string, assignToUserId?: string) => Promise<unknown>
  roles: TodoRole[]
}

type DateShortcut = 'today' | 'tomorrow' | 'monday' | 'none' | 'custom'

function getDateFromShortcut(shortcut: DateShortcut): string | undefined {
  const today = new Date()
  switch (shortcut) {
    case 'today':
      return format(today, 'yyyy-MM-dd')
    case 'tomorrow':
      return format(addDays(today, 1), 'yyyy-MM-dd')
    case 'monday':
      return format(nextMonday(today), 'yyyy-MM-dd')
    case 'none':
      return undefined
    default:
      return undefined
  }
}

export function QuickAdd({ onAdd, roles }: QuickAddProps) {
  const { user } = useAuth()
  const [title, setTitle] = useState('')
  const [selectedRoleId, setSelectedRoleId] = useState<string | undefined>(
    roles.length > 0 ? roles[0].id : undefined
  )
  const [dateShortcut, setDateShortcut] = useState<DateShortcut>('none')
  const [customDate, setCustomDate] = useState('')
  const [adding, setAdding] = useState(false)
  const [showAssign, setShowAssign] = useState(false)
  const [assignTo, setAssignTo] = useState<Profile | null>(null)
  const [assignSearch, setAssignSearch] = useState('')
  const [assignUsers, setAssignUsers] = useState<Profile[]>([])
  const [assignLoading, setAssignLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  // Update default role when roles load
  useEffect(() => {
    if (roles.length > 0 && !selectedRoleId) {
      setSelectedRoleId(roles[0].id)
    }
  }, [roles, selectedRoleId])

  // Search users when assign field is open
  useEffect(() => {
    if (!showAssign || !user) return
    const search = async () => {
      setAssignLoading(true)
      const supabase = createClient()
      let query = supabase.from('profiles').select('*').neq('id', user.id).order('full_name').limit(6)
      if (assignSearch.trim()) {
        query = query.ilike('full_name', `%${assignSearch.trim()}%`)
      }
      const { data } = await query
      if (data) setAssignUsers(data as Profile[])
      setAssignLoading(false)
    }
    const debounce = setTimeout(search, 250)
    return () => clearTimeout(debounce)
  }, [showAssign, assignSearch, user])

  // Focus search when assign opens
  useEffect(() => {
    if (showAssign) searchRef.current?.focus()
  }, [showAssign])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || adding) return

    setAdding(true)
    const dueDate = dateShortcut === 'custom' ? customDate || undefined : getDateFromShortcut(dateShortcut)
    await onAdd(title.trim(), selectedRoleId, dueDate, assignTo?.id)
    setTitle('')
    setDateShortcut('none')
    setCustomDate('')
    setAssignTo(null)
    setShowAssign(false)
    // Role stays selected for batch entry
    setAdding(false)
    inputRef.current?.focus()
  }

  const dateShortcuts: { key: DateShortcut; label: string }[] = [
    { key: 'none', label: 'Nessuna' },
    { key: 'today', label: 'Oggi' },
    { key: 'tomorrow', label: 'Domani' },
    { key: 'monday', label: 'Lunedi' },
    { key: 'custom', label: '📅' },
  ]

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm space-y-2">
      {/* Row 1: Title + Submit */}
      <div className="flex items-center gap-2">
        <Plus className="w-5 h-5 text-gray-400 flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Aggiungi un task..."
          className="flex-1 text-sm outline-none placeholder-gray-400"
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={!title.trim() || adding}
          className="px-3 py-1.5 bg-blue-500 text-white text-xs font-medium rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Invio
        </button>
      </div>

      {/* Row 2: Role chips */}
      {roles.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto pl-7 pb-0.5 scrollbar-hide">
          {roles.map((role) => (
            <button
              key={role.id}
              type="button"
              onClick={() => setSelectedRoleId(role.id)}
              className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                selectedRoleId === role.id
                  ? 'text-white shadow-sm'
                  : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
              }`}
              style={selectedRoleId === role.id ? { backgroundColor: role.color } : undefined}
            >
              {role.name}
            </button>
          ))}
        </div>
      )}

      {/* Row 3: Date shortcuts */}
      <div className="flex items-center gap-1.5 pl-7">
        <Calendar className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
        {dateShortcuts.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setDateShortcut(key)}
            className={`px-2 py-0.5 rounded text-xs transition-colors ${
              dateShortcut === key
                ? 'bg-blue-50 text-blue-600 font-medium'
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
            }`}
          >
            {label}
          </button>
        ))}
        {dateShortcut === 'custom' && (
          <input
            type="date"
            value={customDate}
            onChange={(e) => setCustomDate(e.target.value)}
            className="text-xs border border-gray-200 rounded px-1.5 py-0.5 outline-none focus:ring-1 focus:ring-blue-500"
          />
        )}
      </div>

      {/* Row 4: Quick assign (optional) */}
      <div className="pl-7">
        {!showAssign && !assignTo ? (
          <button
            type="button"
            onClick={() => setShowAssign(true)}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-blue-500 transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Assegna
          </button>
        ) : assignTo ? (
          <div className="flex items-center gap-2">
            <UserPlus className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
            <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 rounded-full px-2.5 py-0.5">
              <span className="text-xs font-medium text-blue-700">{assignTo.full_name}</span>
              <button
                type="button"
                onClick={() => { setAssignTo(null); setShowAssign(false) }}
                className="text-blue-400 hover:text-blue-600"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <UserPlus className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
              <input
                ref={searchRef}
                type="text"
                value={assignSearch}
                onChange={(e) => setAssignSearch(e.target.value)}
                placeholder="Cerca utente..."
                className="flex-1 text-xs outline-none placeholder-gray-400 border border-gray-200 rounded px-2 py-1"
              />
              <button
                type="button"
                onClick={() => { setShowAssign(false); setAssignSearch('') }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex gap-1 flex-wrap ml-5">
              {assignLoading && <span className="text-xs text-gray-400">...</span>}
              {!assignLoading && assignUsers.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => { setAssignTo(u); setShowAssign(false); setAssignSearch('') }}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-gray-50 text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                >
                  <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-medium">
                    {u.full_name?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                  {u.full_name}
                </button>
              ))}
              {!assignLoading && assignUsers.length === 0 && (
                <span className="text-xs text-gray-400">Nessun utente trovato</span>
              )}
            </div>
          </div>
        )}
      </div>
    </form>
  )
}
