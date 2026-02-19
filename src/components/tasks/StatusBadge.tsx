import type { TaskStatus } from '@/types'

const statusConfig: Record<TaskStatus, { label: string; color: string; bg: string }> = {
  todo: { label: 'Da fare', color: 'text-gray-600', bg: 'bg-gray-50 border-gray-200' },
  in_progress: { label: 'In corso', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
  done: { label: 'Completato', color: 'text-green-600', bg: 'bg-green-50 border-green-200' },
  cancelled: { label: 'Annullato', color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
}

interface StatusBadgeProps {
  status: TaskStatus
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full border font-medium ${config.bg} ${config.color}`}>
      {config.label}
    </span>
  )
}
