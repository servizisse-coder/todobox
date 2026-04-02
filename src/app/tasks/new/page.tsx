'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, UserPlus, X, Search } from 'lucide-react'
import Link from 'next/link'
import { AppShell } from '@/components/layout/AppShell'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/providers/AuthProvider'
import { AssignTaskModal } from '@/components/tasks/AssignTaskModal'
import { useAssignments } from '@/hooks/useAssignments'
import { useRoles } from '@/hooks/useRoles'
import { useTasks } from '@/hooks/useTasks'
import { AutocompleteInput } from '@/components/ui/AutocompleteInput'
import type { TaskPriority, TaskVisibility, RecurrenceType, TodoTask, Profile } from '@/types'

export default function NewTaskPageWrapper() {
  return (
    <Suspense fallback={<AppShell><div className="text-center py-8"><div className="animate-pulse text-sm text-gray-400">Caricamento...</div></div></AppShell>}>
      <NewTaskPage />
    </Suspense>
  )
}

function NewTaskPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get('edit')
  const { user } = useAuth()
  const { assignTask } = useAssignments()
  const { roles } = useRoles()
  const { tasks: allTasks } = useTasks()

  // Derive autocomplete suggestions from existing tasks
  const referentSuggestions = [...new Set(allTasks.filter(t => t.referent).map(t => t.referent!))].sort()
  const companySuggestions = [...new Set(allTasks.filter(t => t.company).map(t => t.company!))].sort()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [visibility, setVisibility] = useState<TaskVisibility>('private')
  const [dueDate, setDueDate] = useState('')
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null)
  const [referent, setReferent] = useState('')
  const [company, setCompany] = useState('')
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>('daily')
  const [recurrenceInterval, setRecurrenceInterval] = useState(1)
  const [saving, setSaving] = useState(false)
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [savedTaskId, setSavedTaskId] = useState<string | null>(null)
  const [showAssignField, setShowAssignField] = useState(false)
  const [assignToUsers, setAssignToUsers] = useState<Profile[]>([])
  const [assignSearch, setAssignSearch] = useState('')
  const [assignUsers, setAssignUsers] = useState<Profile[]>([])
  const [assignLoading, setAssignLoading] = useState(false)

  // Load existing task for edit
  useEffect(() => {
    if (!editId || !user) return

    const load = async () => {
      const supabase = createClient()
      const { data } = await supabase.from('todo_tasks').select('*').eq('id', editId).single()
      if (data) {
        const task = data as TodoTask
        setTitle(task.title)
        setDescription(task.description || '')
        setPriority(task.priority)
        setVisibility(task.visibility)
        setDueDate(task.due_date ? task.due_date.split('T')[0] : '')
        setIsRecurring(task.is_recurring)
        if (task.recurrence_type) setRecurrenceType(task.recurrence_type)
        if (task.recurrence_interval) setRecurrenceInterval(task.recurrence_interval)
        if (task.role_id) setSelectedRoleId(task.role_id)
        if (task.referent) setReferent(task.referent)
        if (task.company) setCompany(task.company)
      }
    }
    load()
  }, [editId, user])

  // Search users for inline assignment
  useEffect(() => {
    if (!showAssignField || !user) return
    const searchUsers = async () => {
      setAssignLoading(true)
      const supabase = createClient()
      let query = supabase.from('profiles').select('*').neq('id', user.id).order('full_name').limit(10)
      if (assignSearch.trim()) {
        query = query.ilike('full_name', `%${assignSearch.trim()}%`)
      }
      const { data } = await query
      if (data) setAssignUsers(data as Profile[])
      setAssignLoading(false)
    }
    const debounce = setTimeout(searchUsers, 300)
    return () => clearTimeout(debounce)
  }, [showAssignField, assignSearch, user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !user || saving) return

    setSaving(true)
    const supabase = createClient()

    // If assigning inline, set visibility to 'assigned'
    const hasAssignees = assignToUsers.length > 0
    const effectiveVisibility = hasAssignees ? 'assigned' : visibility

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      priority,
      visibility: effectiveVisibility,
      due_date: dueDate ? new Date(dueDate + 'T12:00:00').toISOString() : null,
      is_recurring: isRecurring,
      recurrence_type: isRecurring ? recurrenceType : null,
      recurrence_interval: isRecurring && recurrenceType === 'custom' ? recurrenceInterval : null,
      role_id: selectedRoleId || null,
      referent: referent.trim() || null,
      company: company.trim() || null,
      ...(hasAssignees ? { assigned_by: user.id } : {}),
    }

    if (editId) {
      await supabase.from('todo_tasks').update(payload).eq('id', editId)
      router.push(`/tasks/${editId}`)
    } else {
      const { data } = await supabase
        .from('todo_tasks')
        .insert({ ...payload, created_by: user.id })
        .select()
        .single()

      if (data) {
        // If inline assignment, create assignment records for each user
        if (hasAssignees) {
          for (const assignUser of assignToUsers) {
            await assignTask(data.id, assignUser.id)
          }
          router.push('/sent')
        } else if (visibility === 'assigned') {
          setSavedTaskId(data.id)
          setSaving(false)
          setAssignModalOpen(true)
          return
        } else {
          router.push('/tasks')
        }
      }
    }
    setSaving(false)
  }

  const handleAssignComplete = async (taskId: string, userId: string) => {
    const success = await assignTask(taskId, userId)
    if (success) {
      router.push('/sent')
    }
    return success
  }

  return (
    <AppShell>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Link href="/tasks" className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-bold text-gray-900">
            {editId ? 'Modifica Task' : 'Nuovo Task'}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Titolo *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Cosa devi fare?"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrizione</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Dettagli opzionali..."
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priorità</label>
            <div className="flex gap-2">
              {(['low', 'medium', 'high'] as TaskPriority[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                    priority === p
                      ? p === 'high' ? 'bg-red-50 text-red-600 border-red-200'
                        : p === 'medium' ? 'bg-amber-50 text-amber-600 border-amber-200'
                        : 'bg-green-50 text-green-600 border-green-200'
                      : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {p === 'high' ? 'Alta' : p === 'medium' ? 'Media' : 'Bassa'}
                </button>
              ))}
            </div>
          </div>

          {/* Role */}
          {roles.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ruolo</label>
              <div className="flex gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setSelectedRoleId(null)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                    !selectedRoleId
                      ? 'bg-gray-100 text-gray-700 border-gray-300'
                      : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  Nessuno
                </button>
                {roles.map((role) => (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setSelectedRoleId(role.id)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                      selectedRoleId === role.id
                        ? 'text-white'
                        : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                    }`}
                    style={selectedRoleId === role.id ? { backgroundColor: role.color } : undefined}
                  >
                    {role.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Referent */}
          <AutocompleteInput
            value={referent}
            onChange={setReferent}
            suggestions={referentSuggestions}
            label="Referente"
            placeholder="Chi ha assegnato o attende il risultato?"
          />

          {/* Company */}
          <AutocompleteInput
            value={company}
            onChange={setCompany}
            suggestions={companySuggestions}
            label="Azienda"
            placeholder="Azienda associata (opzionale)"
          />

          {/* Assign to (collapsible, multi-user) */}
          {!editId && (
            <div>
              {/* Selected users chips */}
              {assignToUsers.length > 0 && (
                <div className="mb-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assegnato a</label>
                  <div className="flex flex-wrap gap-2">
                    {assignToUsers.map((u) => (
                      <div key={u.id} className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5">
                        <div className="w-5 h-5 rounded-full bg-blue-200 text-blue-700 flex items-center justify-center text-xs font-medium">
                          {u.full_name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <span className="text-sm font-medium text-blue-700">{u.full_name}</span>
                        <button
                          type="button"
                          onClick={() => setAssignToUsers(prev => prev.filter(p => p.id !== u.id))}
                          className="p-0.5 rounded hover:bg-blue-100"
                        >
                          <X className="w-3.5 h-3.5 text-blue-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!showAssignField && assignToUsers.length === 0 ? (
                <button
                  type="button"
                  onClick={() => setShowAssignField(true)}
                  className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  Assegna a qualcuno
                </button>
              ) : !showAssignField && assignToUsers.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setShowAssignField(true)}
                  className="flex items-center gap-2 text-sm text-blue-500 hover:text-blue-600 transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  Aggiungi altro
                </button>
              ) : showAssignField ? (
                <div>
                  {assignToUsers.length === 0 && (
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assegna a</label>
                  )}
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={assignSearch}
                      onChange={(e) => setAssignSearch(e.target.value)}
                      placeholder="Cerca utente..."
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-1 border border-gray-100 rounded-lg">
                    {assignLoading && <p className="text-xs text-gray-400 text-center py-3">Caricamento...</p>}
                    {!assignLoading && assignUsers.filter(u => !assignToUsers.some(s => s.id === u.id)).length === 0 && (
                      <p className="text-xs text-gray-400 text-center py-3">Nessun utente</p>
                    )}
                    {assignUsers
                      .filter(u => !assignToUsers.some(s => s.id === u.id))
                      .map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => {
                          setAssignToUsers(prev => [...prev, u])
                          setAssignSearch('')
                        }}
                        className="w-full flex items-center gap-2 p-2 hover:bg-gray-50 text-left"
                      >
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium">
                          {u.full_name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <span className="text-sm text-gray-900">{u.full_name}</span>
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => { setShowAssignField(false); setAssignSearch('') }}
                    className="mt-1 text-xs text-gray-400 hover:text-gray-600"
                  >
                    Chiudi
                  </button>
                </div>
              ) : null}
            </div>
          )}

          {/* Visibility (only shown when not using inline assignment) */}
          {assignToUsers.length === 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Visibilita</label>
              <div className="flex gap-2">
                {[
                  { value: 'private' as TaskVisibility, label: 'Privato' },
                  { value: 'public' as TaskVisibility, label: 'Pubblico' },
                ].map((v) => (
                  <button
                    key={v.value}
                    type="button"
                    onClick={() => setVisibility(v.value)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                      visibility === v.value
                        ? 'bg-blue-50 text-blue-600 border-blue-200'
                        : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Scadenza</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Recurring */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
              />
              Task ricorrente
            </label>

            {isRecurring && (
              <div className="mt-2 flex items-center gap-2">
                <select
                  value={recurrenceType}
                  onChange={(e) => setRecurrenceType(e.target.value as RecurrenceType)}
                  className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="daily">Giornaliero</option>
                  <option value="weekly">Settimanale</option>
                  <option value="monthly">Mensile</option>
                  <option value="custom">Personalizzato</option>
                </select>
                {recurrenceType === 'custom' && (
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-gray-500">Ogni</span>
                    <input
                      type="number"
                      min={1}
                      value={recurrenceInterval}
                      onChange={(e) => setRecurrenceInterval(parseInt(e.target.value) || 1)}
                      className="w-16 text-sm border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-500">giorni</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!title.trim() || saving}
            className="w-full bg-blue-500 text-white py-2.5 px-4 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Salvataggio...' : editId ? 'Salva modifiche' : 'Crea task'}
          </button>
        </form>
      </div>

      {savedTaskId && (
        <AssignTaskModal
          taskId={savedTaskId}
          open={assignModalOpen}
          onClose={() => { setAssignModalOpen(false); router.push('/sent') }}
          onAssign={handleAssignComplete}
        />
      )}
    </AppShell>
  )
}
