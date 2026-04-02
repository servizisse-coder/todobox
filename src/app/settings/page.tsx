'use client'

import { useMemo } from 'react'
import { Settings, Eye } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import RoleManager from '@/components/settings/RoleManager'
import { WorkScheduleEditor } from '@/components/settings/WorkScheduleEditor'
import { useRoles } from '@/hooks/useRoles'
import { useTasks } from '@/hooks/useTasks'
import { useFilterStore } from '@/store/filterStore'

export default function SettingsPage() {
  const { roles, loading, createRole, updateRole, deleteRole, setDefaultRole, reorderRoles } = useRoles()
  const { tasks } = useTasks()
  const { viewPrefs, setViewPref } = useFilterStore()

  const taskCountByRole = useMemo(() => {
    const counts: Record<string, number> = {}
    tasks.forEach((task) => {
      if (task.role_id) {
        counts[task.role_id] = (counts[task.role_id] || 0) + 1
      }
    })
    return counts
  }, [tasks])

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Settings className="w-6 h-6 text-gray-400" />
          <h1 className="text-2xl font-bold text-gray-900">Impostazioni</h1>
        </div>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Ruoli</h2>
          <p className="text-sm text-gray-500 mb-4">
            I ruoli ti aiutano a organizzare i task per area di responsabilità. Ogni task avrà un ruolo associato.
          </p>

          {loading ? (
            <p className="text-gray-400 text-sm py-8 text-center">Caricamento ruoli...</p>
          ) : (
            <RoleManager
              roles={roles}
              onCreateRole={createRole}
              onUpdateRole={updateRole}
              onDeleteRole={deleteRole}
              onSetDefault={setDefaultRole}
              onReorder={reorderRoles}
              taskCountByRole={taskCountByRole}
            />
          )}
        </section>

        <hr className="my-8 border-gray-200" />

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Orario di lavoro</h2>
          <p className="text-sm text-gray-500 mb-4">
            Imposta il tuo orario lavorativo per ogni giorno della settimana.
          </p>
          <WorkScheduleEditor />
        </section>

        <hr className="my-8 border-gray-200" />

        <section>
          <div className="flex items-center gap-2 mb-1">
            <Eye className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900">Visualizzazione</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Scegli cosa mostrare nelle card dei task. Le preferenze vengono salvate sul tuo browser.
          </p>

          <div className="space-y-3">
            {([
              { key: 'showRoleBadge' as const, label: 'Badge ruolo', desc: 'Mostra il badge colorato del ruolo' },
              { key: 'showDueDateBadge' as const, label: 'Scadenza', desc: 'Mostra il badge con la data di scadenza' },
              { key: 'showPriorityBadge' as const, label: 'Priorità', desc: 'Mostra il badge priorità (alta/media/bassa)' },
              { key: 'showAssignment' as const, label: 'Assegnazione', desc: 'Mostra chi ha assegnato o a chi è assegnato' },
            ]).map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{label}</p>
                  <p className="text-xs text-gray-400">{desc}</p>
                </div>
                <button
                  onClick={() => setViewPref(key, !viewPrefs[key])}
                  className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${
                    viewPrefs[key] ? 'bg-blue-500' : 'bg-gray-200'
                  }`}
                >
                  <span className={`absolute top-[2px] left-[2px] w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                    viewPrefs[key] ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  )
}
