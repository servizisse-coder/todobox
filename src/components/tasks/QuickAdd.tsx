'use client'

import { useState, useRef, useEffect } from 'react'
import { Plus, Calendar } from 'lucide-react'
import { addDays, nextMonday, format } from 'date-fns'
import type { TodoRole } from '@/types'

interface QuickAddProps {
  onAdd: (title: string, roleId?: string, dueDate?: string) => Promise<unknown>
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
  const [title, setTitle] = useState('')
  const [selectedRoleId, setSelectedRoleId] = useState<string | undefined>(
    roles.length > 0 ? roles[0].id : undefined
  )
  const [dateShortcut, setDateShortcut] = useState<DateShortcut>('none')
  const [customDate, setCustomDate] = useState('')
  const [adding, setAdding] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Update default role when roles load
  useEffect(() => {
    if (roles.length > 0 && !selectedRoleId) {
      setSelectedRoleId(roles[0].id)
    }
  }, [roles, selectedRoleId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || adding) return

    setAdding(true)
    const dueDate = dateShortcut === 'custom' ? customDate || undefined : getDateFromShortcut(dateShortcut)
    await onAdd(title.trim(), selectedRoleId, dueDate)
    setTitle('')
    setDateShortcut('none')
    setCustomDate('')
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
    </form>
  )
}
