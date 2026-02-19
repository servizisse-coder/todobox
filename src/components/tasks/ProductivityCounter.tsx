import { ProgressBar } from '@/components/ui/ProgressBar'
import { Zap } from 'lucide-react'

interface ProductivityCounterProps {
  completed: number
  total: number
}

export function ProductivityCounter({ completed, total }: ProductivityCounterProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Zap className="w-4 h-4 text-amber-500" />
        <span className="text-sm font-medium text-gray-900">Produttività di oggi</span>
      </div>
      <ProgressBar value={completed} max={total} />
    </div>
  )
}
