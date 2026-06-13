export default function NewsCardSkeleton() {
  return (
    <div className="rounded-lg border border-gray-200 p-4 animate-pulse">
      <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
      <div className="flex items-center gap-2 mb-3">
        <div className="h-4 bg-gray-200 rounded-full w-20" />
        <div className="h-4 bg-gray-200 rounded w-12" />
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded" />
        <div className="h-4 bg-gray-200 rounded w-5/6" />
      </div>
    </div>
  )
}
