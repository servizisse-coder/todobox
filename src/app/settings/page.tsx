'use client'

import { useMemo } from 'react'
import { Settings } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import RoleManager from '@/components/settings/RoleManager'
import { WorkScheduleEditor } from '@/components/settings/WorkScheduleEditor'
import { useRoles } from '@/hooks/useRoles'
import { useTasks } from '@/hooks/useTasks'

export default function SettingsPage() {
  const { roles, loading, createRole, updateRole, deleteRole, setDefaultRole, reorderRoles } = useRoles()
  const { tasks } = useTasks()

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
      </div>
    </AppShell>
  )
}
