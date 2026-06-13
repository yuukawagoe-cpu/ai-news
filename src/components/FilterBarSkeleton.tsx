export default function FilterBarSkeleton() {
  return (
    <div className="flex gap-2 flex-wrap animate-pulse">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-9 w-24 bg-gray-200 rounded-full" />
      ))}
    </div>
  )
}
