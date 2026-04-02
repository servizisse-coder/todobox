export function TaskSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white border border-gray-200 rounded-xl p-3 animate-pulse">
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-gray-200 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="flex gap-2">
                <div className="h-3 bg-gray-100 rounded w-16" />
                <div className="h-3 bg-gray-100 rounded w-12" />
              </div>
            </div>
            <div className="h-5 bg-gray-100 rounded w-12" />
          </div>
        </div>
      ))}
    </div>
  )
}
