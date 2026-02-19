import { Calendar } from 'lucide-react'
import { format, isToday, isPast, isTomorrow } from 'date-fns'
import { it } from 'date-fns/locale'

interface DueDateBadgeProps {
  dueDate: string
  completed?: boolean
}

export function DueDateBadge({ dueDate, completed }: DueDateBadgeProps) {
  const date = new Date(dueDate)
  const overdue = isPast(date) && !isToday(date) && !completed
  const dueToday = isToday(date) && !completed
  const dueTomorrow = isTomorrow(date)

  let label: string
  let className: string

  if (overdue) {
    label = 'Scaduto'
    className = 'text-red-600 bg-red-50'
  } else if (dueToday) {
    label = 'Oggi'
    className = 'text-amber-600 bg-amber-50'
  } else if (dueTomorrow) {
    label = 'Domani'
    className = 'text-blue-600 bg-blue-50'
  } else {
    label = format(date, 'd MMM', { locale: it })
    className = 'text-gray-500 bg-gray-50'
  }

  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${className}`}>
      <Calendar className="w-3 h-3" />
      {label}
    </span>
  )
}
