import type { NewsItem } from "@/lib/types"
import NewsCard from "@/components/NewsCard"

export default function NewsList({ items }: { items: NewsItem[] }) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        現在表示できるニュースがありません
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {items.map((item) => (
        <NewsCard key={item.id} item={item} />
      ))}
    </div>
  )
}
