'use client'

import { useState } from 'react'
import { Plus, Calendar } from 'lucide-react'

interface QuickAddProps {
  onAdd: (title: string, dueDate?: string) => Promise<unknown>
}

export function QuickAdd({ onAdd }: QuickAddProps) {
  const [title, setTitle] = useState('')
  const [showDate, setShowDate] = useState(false)
  const [dueDate, setDueDate] = useState('')
  const [adding, setAdding] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || adding) return

    setAdding(true)
    await onAdd(title.trim(), dueDate || undefined)
    setTitle('')
    setDueDate('')
    setShowDate(false)
    setAdding(false)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
      <div className="flex items-center gap-2">
        <Plus className="w-5 h-5 text-gray-400 flex-shrink-0" />
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Aggiungi un task..."
          className="flex-1 text-sm outline-none placeholder-gray-400 quick-add-input"
          autoComplete="off"
        />
        <button
          type="button"
          onClick={() => setShowDate(!showDate)}
          className={`p-1.5 rounded-lg transition-colors ${showDate ? 'bg-blue-50 text-blue-500' : 'hover:bg-gray-100 text-gray-400'}`}
        >
          <Calendar className="w-4 h-4" />
        </button>
        <button
          type="submit"
          disabled={!title.trim() || adding}
          className="px-3 py-1.5 bg-blue-500 text-white text-xs font-medium rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Invio
        </button>
      </div>
      {showDate && (
        <div className="mt-2 pl-7">
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      )}
    </form>
  )
}
