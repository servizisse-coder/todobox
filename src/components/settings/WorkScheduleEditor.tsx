'use client'

import { useWorkSchedule } from '@/hooks/useWorkSchedule'
import type { WorkSchedule } from '@/types'

const DAYS = [
  { key: 'monday', label: 'Lunedi' },
  { key: 'tuesday', label: 'Martedi' },
  { key: 'wednesday', label: 'Mercoledi' },
  { key: 'thursday', label: 'Giovedi' },
  { key: 'friday', label: 'Venerdi' },
  { key: 'saturday', label: 'Sabato' },
  { key: 'sunday', label: 'Domenica' },
] as const

export function WorkScheduleEditor() {
  const { schedule, loading, saveSchedule, getWeeklyMinutes } = useWorkSchedule()

  if (loading) {
    return <p className="text-gray-400 text-sm py-8 text-center">Caricamento orario...</p>
  }

  if (!schedule) return null

  const weeklyMinutes = getWeeklyMinutes()
  const weeklyHours = Math.floor(weeklyMinutes / 60)
  const weeklyMins = weeklyMinutes % 60

  const handleTimeChange = (day: string, field: 'start' | 'end', value: string) => {
    const key = `${day}_${field}` as keyof WorkSchedule
    saveSchedule({ [key]: value || null } as Partial<WorkSchedule>)
  }

  const handleToggleDay = (day: string) => {
    const startKey = `${day}_start` as keyof WorkSchedule
    const endKey = `${day}_end` as keyof WorkSchedule
    const isActive = schedule[startKey] !== null

    if (isActive) {
      saveSchedule({ [startKey]: null, [endKey]: null } as Partial<WorkSchedule>)
    } else {
      saveSchedule({ [startKey]: '09:00', [endKey]: '18:00' } as Partial<WorkSchedule>)
    }
  }

  return (
    <div className="space-y-3">
      {DAYS.map(({ key, label }) => {
        const startKey = `${key}_start` as keyof WorkSchedule
        const endKey = `${key}_end` as keyof WorkSchedule
        const startVal = schedule[startKey] as string | null
        const endVal = schedule[endKey] as string | null
        const isActive = startVal !== null

        return (
          <div key={key} className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg p-3">
            <button
              onClick={() => handleToggleDay(key)}
              className={`w-8 h-5 rounded-full transition-colors relative flex-shrink-0 ${
                isActive ? 'bg-blue-500' : 'bg-gray-200'
              }`}
            >
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                isActive ? 'translate-x-3.5' : 'translate-x-0.5'
              }`} />
            </button>
            <span className={`text-sm font-medium w-20 ${isActive ? 'text-gray-900' : 'text-gray-400'}`}>
              {label}
            </span>
            {isActive ? (
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="time"
                  value={startVal || '09:00'}
                  onChange={(e) => handleTimeChange(key, 'start', e.target.value)}
                  className="text-sm border border-gray-200 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-blue-500"
                />
                <span className="text-gray-400 text-xs">-</span>
                <input
                  type="time"
                  value={endVal || '18:00'}
                  onChange={(e) => handleTimeChange(key, 'end', e.target.value)}
                  className="text-sm border border-gray-200 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            ) : (
              <span className="text-xs text-gray-400">Non lavorativo</span>
            )}
          </div>
        )
      })}

      <div className="text-right text-sm text-gray-500 pt-2">
        Totale settimanale: <span className="font-semibold text-gray-900">{weeklyHours}h{weeklyMins > 0 ? ` ${weeklyMins}m` : ''}</span>
      </div>
    </div>
  )
}
