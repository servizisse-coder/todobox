'use client'

import { useState } from 'react'
import { MessageSquarePlus, Bug, Lightbulb, HelpCircle, CheckCircle2, Clock, XCircle, MessageCircle } from 'lucide-react'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { AppShell } from '@/components/layout/AppShell'
import { EmptyState } from '@/components/ui/EmptyState'
import { useFeedback } from '@/hooks/useFeedback'
import { useAuth } from '@/components/providers/AuthProvider'
import type { FeedbackType, FeedbackStatus } from '@/types'

const typeConfig: Record<FeedbackType, { label: string; icon: typeof Bug; color: string; bgColor: string }> = {
  bug: { label: 'Bug', icon: Bug, color: 'text-red-600', bgColor: 'bg-red-50 border-red-200' },
  improvement: { label: 'Miglioramento', icon: Lightbulb, color: 'text-amber-600', bgColor: 'bg-amber-50 border-amber-200' },
  question: { label: 'Domanda', icon: HelpCircle, color: 'text-blue-600', bgColor: 'bg-blue-50 border-blue-200' },
}

const statusConfig: Record<FeedbackStatus, { label: string; icon: typeof Clock; color: string }> = {
  open: { label: 'Aperto', icon: Clock, color: 'text-amber-600' },
  in_progress: { label: 'In lavorazione', icon: Clock, color: 'text-blue-600' },
  resolved: { label: 'Risolto', icon: CheckCircle2, color: 'text-green-600' },
  wont_fix: { label: 'Non previsto', icon: XCircle, color: 'text-gray-500' },
}

export default function FeedbackPage() {
  const { user, profile } = useAuth()
  const { feedback, loading, createFeedback, respondToFeedback } = useFeedback()
  const [showForm, setShowForm] = useState(false)
  const [type, setType] = useState<FeedbackType>('improvement')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [respondingId, setRespondingId] = useState<string | null>(null)
  const [responseText, setResponseText] = useState('')
  const [responseStatus, setResponseStatus] = useState<FeedbackStatus>('resolved')

  const isAdmin = profile?.is_admin || profile?.is_direction

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || saving) return
    setSaving(true)
    const success = await createFeedback(type, title, description)
    if (success) {
      setTitle('')
      setDescription('')
      setShowForm(false)
    }
    setSaving(false)
  }

  const handleRespond = async (feedbackId: string) => {
    await respondToFeedback(feedbackId, responseStatus, responseText)
    setRespondingId(null)
    setResponseText('')
  }

  return (
    <AppShell>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquarePlus className="w-5 h-5 text-blue-500" />
            <h1 className="text-lg font-bold text-gray-900">Feedback</h1>
          </div>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="px-3 py-1.5 bg-blue-500 text-white text-xs font-medium rounded-lg hover:bg-blue-600"
            >
              Nuovo feedback
            </button>
          )}
        </div>

        {/* New feedback form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
            {/* Type selector */}
            <div className="flex gap-2">
              {(Object.entries(typeConfig) as [FeedbackType, typeof typeConfig.bug][]).map(([key, cfg]) => {
                const Icon = cfg.icon
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setType(key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                      type === key ? cfg.bgColor + ' ' + cfg.color : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {cfg.label}
                  </button>
                )
              })}
            </div>

            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={type === 'bug' ? 'Cosa non funziona?' : type === 'improvement' ? 'Cosa miglioreresti?' : 'Qual è la tua domanda?'}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              required
              autoFocus
            />

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrivi nel dettaglio (opzionale)..."
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={!title.trim() || saving}
                className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                {saving ? 'Invio...' : 'Invia feedback'}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setTitle(''); setDescription('') }}
                className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200"
              >
                Annulla
              </button>
            </div>
          </form>
        )}

        {/* Feedback list */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-pulse text-sm text-gray-400">Caricamento...</div>
          </div>
        ) : feedback.length === 0 ? (
          <EmptyState
            icon={MessageSquarePlus}
            title="Nessun feedback"
            description="Segnala un bug o suggerisci un miglioramento."
          />
        ) : (
          <div className="space-y-2">
            {feedback.map((fb) => {
              const cfg = typeConfig[fb.type as FeedbackType] || typeConfig.improvement
              const sCfg = statusConfig[fb.status as FeedbackStatus] || statusConfig.open
              const Icon = cfg.icon
              const StatusIcon = sCfg.icon
              const author = fb.user as { full_name?: string } | undefined

              return (
                <div key={fb.id} className="bg-white border border-gray-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.bgColor}`}>
                      <Icon className={`w-4 h-4 ${cfg.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-medium text-gray-900">{fb.title}</h3>
                        <span className={`flex items-center gap-1 text-xs ${sCfg.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {sCfg.label}
                        </span>
                      </div>
                      {fb.description && (
                        <p className="text-sm text-gray-600 mt-1">{fb.description}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1.5">
                        {author?.full_name || 'Utente'} · {format(new Date(fb.created_at), 'd MMM yyyy, HH:mm', { locale: it })}
                      </p>

                      {/* Admin response */}
                      {fb.admin_response && (
                        <div className="mt-2 bg-blue-50 border border-blue-100 rounded-lg p-2.5">
                          <div className="flex items-center gap-1 text-xs text-blue-600 font-medium mb-1">
                            <MessageCircle className="w-3 h-3" />
                            Risposta
                          </div>
                          <p className="text-sm text-gray-700">{fb.admin_response}</p>
                        </div>
                      )}

                      {/* Admin respond form */}
                      {isAdmin && respondingId === fb.id && (
                        <div className="mt-2 space-y-2">
                          <div className="flex gap-2">
                            {(['resolved', 'in_progress', 'wont_fix'] as FeedbackStatus[]).map(s => (
                              <button
                                key={s}
                                type="button"
                                onClick={() => setResponseStatus(s)}
                                className={`text-xs px-2 py-1 rounded border ${
                                  responseStatus === s ? 'bg-blue-50 text-blue-600 border-blue-200' : 'text-gray-500 border-gray-200'
                                }`}
                              >
                                {statusConfig[s].label}
                              </button>
                            ))}
                          </div>
                          <textarea
                            value={responseText}
                            onChange={(e) => setResponseText(e.target.value)}
                            placeholder="Scrivi una risposta (opzionale)..."
                            rows={2}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleRespond(fb.id)}
                              className="px-3 py-1.5 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600"
                            >
                              Invia risposta
                            </button>
                            <button
                              onClick={() => setRespondingId(null)}
                              className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs rounded-lg hover:bg-gray-200"
                            >
                              Annulla
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Admin respond button */}
                      {isAdmin && fb.status === 'open' && respondingId !== fb.id && (
                        <button
                          onClick={() => setRespondingId(fb.id)}
                          className="mt-2 text-xs text-blue-500 hover:text-blue-600 font-medium"
                        >
                          Rispondi
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AppShell>
  )
}
