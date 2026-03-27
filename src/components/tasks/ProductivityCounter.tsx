import { ProgressBar } from '@/components/ui/ProgressBar'
import { Zap } from 'lucide-react'

interface ProductivityCounterProps {
  completed: number
  total: number
  completedByMe?: number
  delegatedCompleted?: number
}

export function ProductivityCounter({ completed, total, completedByMe, delegatedCompleted }: ProductivityCounterProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-1">
        <Zap className="w-4 h-4 text-amber-500" />
        <span className="text-sm font-medium text-gray-900">Produttività di oggi</span>
      </div>
      {completedByMe !== undefined && (
        <div className="mb-2">
          <span className="text-xs text-gray-500">
            Completati da me: <span className="font-semibold text-gray-900">{completedByMe}</span>
          </span>
          {delegatedCompleted !== undefined && delegatedCompleted > 0 && (
            <span className="text-xs text-gray-400 ml-2">
              · Delegati completati: {delegatedCompleted}
            </span>
          )}
        </div>
      )}
      <ProgressBar value={completed} max={total} />
    </div>
  )
}
