import type { NewsItem } from "@/lib/types"
import { formatRelativeTime } from "@/lib/utils"
import SummarizeButton from "@/components/SummarizeButton"

const HAS_BACKEND = !!process.env.PYTHON_API_URL

export default function NewsCard({ item }: { item: NewsItem }) {
  return (
    <div className="rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={item.title}
        className="block"
      >
        <h2 className="font-semibold text-base leading-snug mb-2 hover:underline line-clamp-2">
          {item.title}
        </h2>
      </a>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-medium bg-blue-100 text-blue-700 rounded-full px-2 py-0.5">
          {item.source}
        </span>
        <span className="text-xs text-gray-500">
          {formatRelativeTime(item.publishedAt)}
        </span>
      </div>
      {item.description && (
        <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>
      )}
      {HAS_BACKEND && (
        <SummarizeButton title={item.title} description={item.description} />
      )}
    </div>
  )
}
