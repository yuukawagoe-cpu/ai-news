"use client"

import { useEffect, useState } from "react"

interface TrendingItem {
  title: string
  url: string
  source: string
  trending_score: number
  summary?: string
}

export default function TrendingBox() {
  const [items, setItems] = useState<TrendingItem[] | null>(null)

  useEffect(() => {
    fetch("/api/trending?limit=3")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setItems(d?.items ?? []))
      .catch(() => setItems([]))
  }, [])

  if (items === null) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-sm text-blue-400 animate-pulse">
        今最も話題のトピックを読み込み中...
      </div>
    )
  }

  if (items.length === 0) return null

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-6">
      <h2 className="text-sm font-bold text-blue-700 mb-3">今最も話題のトピック</h2>
      <div className="space-y-4">
        {items.map((item, i) => (
          <div key={item.url} className={i > 0 ? "pt-4 border-t border-blue-100" : ""}>
            <div className="flex gap-2">
              <span className="text-blue-300 font-bold text-lg leading-none shrink-0">#{i + 1}</span>
              <div className="min-w-0">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-gray-800 hover:underline leading-snug block"
                >
                  {item.title}
                </a>
                <p className="text-xs text-gray-500 mt-0.5">
                  {item.source}
                  {item.trending_score > 0 && (
                    <span className="ml-2 inline-flex items-center gap-0.5 text-blue-500">
                      <span>🔥</span>
                      <span>話題度 {item.trending_score}</span>
                    </span>
                  )}
                </p>
                {item.summary && (
                  <p className="mt-1.5 text-xs text-gray-600 leading-relaxed bg-white rounded p-2 border border-blue-100">
                    {item.summary}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
