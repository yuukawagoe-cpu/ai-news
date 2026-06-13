"use client"

import { useState } from "react"

interface SearchItem {
  title: string
  url: string
  source: string
  description: string
  score: number
}

interface SearchResult {
  answer: string
  items: SearchItem[]
}

export default function SearchClient() {
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SearchResult | null>(null)
  const [error, setError] = useState("")

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setError("")
    setResult(null)
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      })
      if (!res.ok) throw new Error()
      setResult(await res.json())
    } catch {
      setError(
        "検索に失敗しました。バックエンドが起動中の場合は少し待ってから再試行してください。"
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="px-4 py-6 max-w-3xl mx-auto">
      <h2 className="text-lg font-semibold mb-4">AI記事をセマンティック検索</h2>

      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="例: 先週のLLM関連ニュースは？"
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg disabled:opacity-50 hover:bg-blue-700 transition-colors"
        >
          {loading ? "検索中…" : "検索"}
        </button>
      </form>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      {result && (
        <div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-xs font-semibold text-blue-700 mb-1 uppercase tracking-wide">
              AIの回答
            </p>
            <p className="text-sm text-gray-700 leading-relaxed">{result.answer}</p>
          </div>

          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            関連記事 {result.items.length}件
          </p>
          <div className="space-y-3">
            {result.items.map((item, i) => (
              <a
                key={i}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <h3 className="font-medium text-sm mb-1 hover:underline">{item.title}</h3>
                <span className="text-xs bg-blue-100 text-blue-700 rounded-full px-2 py-0.5">
                  {item.source}
                </span>
                {item.description && (
                  <p className="text-xs text-gray-500 mt-2 line-clamp-2">{item.description}</p>
                )}
              </a>
            ))}
          </div>
        </div>
      )}

      {!result && !loading && !error && (
        <p className="text-sm text-gray-400 text-center mt-12">
          検索ワードを入力してください
        </p>
      )}
    </div>
  )
}
