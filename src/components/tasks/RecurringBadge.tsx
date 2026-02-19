import { RefreshCw } from 'lucide-react'
import type { RecurrenceType } from '@/types'

const labels: Record<RecurrenceType, string> = {
  daily: 'Giornaliero',
  weekly: 'Settimanale',
  monthly: 'Mensile',
  custom: 'Personalizzato',
}

interface RecurringBadgeProps {
  recurrenceType: RecurrenceType
  interval?: number | null
}

export function RecurringBadge({ recurrenceType, interval }: RecurringBadgeProps) {
  let label = labels[recurrenceType]
  if (recurrenceType === 'custom' && interval) {
    label = `Ogni ${interval}g`
  }

  return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-600">
      <RefreshCw className="w-3 h-3" />
      {label}
    </span>
  )
}
