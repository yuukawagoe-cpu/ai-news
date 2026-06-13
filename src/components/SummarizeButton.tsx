"use client"

import { useState } from "react"

interface SummarizeButtonProps {
  title: string
  description: string
}

export default function SummarizeButton({ title, description }: SummarizeButtonProps) {
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState("")
  const [error, setError] = useState(false)

  async function handleClick() {
    if (summary) {
      setSummary("")
      return
    }
    setLoading(true)
    setError(false)
    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setSummary(data.summary)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-2">
      <button
        onClick={handleClick}
        disabled={loading}
        className="text-xs text-blue-600 hover:underline disabled:opacity-50"
      >
        {loading ? "要約中…" : summary ? "要約を閉じる" : "AI要約を見る"}
      </button>
      {summary && (
        <p className="mt-1 text-xs text-gray-600 bg-blue-50 rounded p-2 leading-relaxed">
          {summary}
        </p>
      )}
      {error && (
        <p className="mt-1 text-xs text-red-500">要約の取得に失敗しました</p>
      )}
    </div>
  )
}
