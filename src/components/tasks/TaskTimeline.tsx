'use client'

import { useState } from 'react'
import { Send } from 'lucide-react'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import type { TodoUpdate } from '@/types'

const updateTypeLabels: Record<string, string> = {
  note: 'Nota',
  status_change: 'Cambio stato',
  priority_change: 'Cambio priorità',
  claimed: 'Preso in carico',
  assigned: 'Assegnato',
  accepted: 'Accettato',
  declined: 'Rifiutato',
}

const statusLabels: Record<string, string> = {
  todo: 'Da fare',
  in_progress: 'In corso',
  done: 'Completato',
  cancelled: 'Annullato',
}

const priorityLabels: Record<string, string> = {
  high: 'Alta',
  medium: 'Media',
  low: 'Bassa',
}

interface TaskTimelineProps {
  updates: TodoUpdate[]
  onAddNote: (content: string) => Promise<boolean>
}

export function TaskTimeline({ updates, onAddNote }: TaskTimelineProps) {
  const [note, setNote] = useState('')
  const [sending, setSending] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!note.trim() || sending) return

    setSending(true)
    const success = await onAddNote(note.trim())
    if (success) setNote('')
    setSending(false)
  }

  const getUpdateText = (update: TodoUpdate) => {
    switch (update.update_type) {
      case 'note':
        return update.content || ''
      case 'status_change':
        return `${statusLabels[update.old_value || ''] || update.old_value} → ${statusLabels[update.new_value || ''] || update.new_value}`
      case 'priority_change':
        return `${priorityLabels[update.old_value || ''] || update.old_value} → ${priorityLabels[update.new_value || ''] || update.new_value}`
      case 'claimed':
        return 'Ha preso in carico il task'
      case 'assigned':
        return 'Ha assegnato il task'
      case 'accepted':
        return 'Ha accettato il task'
      case 'declined':
        return `Ha rifiutato il task${update.content ? `: ${update.content}` : ''}`
      default:
        return update.content || ''
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-900">Timeline</h3>

      {/* Add note form */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Aggiungi una nota..."
          className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          type="submit"
          disabled={!note.trim() || sending}
          className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      {/* Updates list */}
      <div className="space-y-3">
        {updates.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">Nessun aggiornamento</p>
        )}
        {updates.map((update) => (
          <div key={update.id} className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-xs font-medium flex-shrink-0">
              {update.user?.full_name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900">
                  {update.user?.full_name || 'Utente'}
                </span>
                <span className="text-xs text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">
                  {updateTypeLabels[update.update_type]}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-0.5">{getUpdateText(update)}</p>
              <p className="text-xs text-gray-400 mt-1">
                {format(new Date(update.created_at), 'd MMM yyyy, HH:mm', { locale: it })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
