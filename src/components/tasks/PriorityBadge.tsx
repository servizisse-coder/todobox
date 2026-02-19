'use client'

import type { TaskPriority } from '@/types'

const priorityConfig: Record<TaskPriority, { label: string; color: string; bg: string }> = {
  high: { label: 'Alta', color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
  medium: { label: 'Media', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
  low: { label: 'Bassa', color: 'text-green-600', bg: 'bg-green-50 border-green-200' },
}

const priorityCycle: TaskPriority[] = ['low', 'medium', 'high']

interface PriorityBadgeProps {
  priority: TaskPriority
  onClick?: (newPriority: TaskPriority) => void
  size?: 'sm' | 'md'
}

export function PriorityBadge({ priority, onClick, size = 'sm' }: PriorityBadgeProps) {
  const config = priorityConfig[priority]

  const handleClick = () => {
    if (!onClick) return
    const currentIndex = priorityCycle.indexOf(priority)
    const nextPriority = priorityCycle[(currentIndex + 1) % priorityCycle.length]
    onClick(nextPriority)
  }

  return (
    <button
      onClick={onClick ? handleClick : undefined}
      disabled={!onClick}
      className={`
        inline-flex items-center gap-1 border rounded-full font-medium
        ${config.bg} ${config.color}
        ${onClick ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}
        ${size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1'}
      `}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {config.label}
    </button>
  )
}
