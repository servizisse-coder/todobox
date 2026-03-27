'use client'

import type { TodoRole } from '@/types'

interface RoleBadgeProps {
  role: TodoRole
  size?: 'sm' | 'md'
}

export function RoleBadge({ role, size = 'sm' }: RoleBadgeProps) {
  const sizeClasses = size === 'sm'
    ? 'px-2 py-0.5 text-[10px]'
    : 'px-2.5 py-1 text-xs'

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium text-white ${sizeClasses}`}
      style={{ backgroundColor: role.color }}
    >
      {role.name}
    </span>
  )
}
