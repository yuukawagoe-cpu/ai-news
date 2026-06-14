"use client"

import { useEffect, useState } from "react"
import type { NewsItem } from "@/lib/types"
import NewsCard from "@/components/NewsCard"
import { useTranslation } from "@/context/TranslationContext"

export default function NewsList({
  items,
  hasBackend,
}: {
  items: NewsItem[]
  hasBackend: boolean
}) {
  const { isJapanese } = useTranslation()
  const [translations, setTranslations] = useState<string[]>([])
  const [translating, setTranslating] = useState(false)

  // Reset translations when the article list changes (filter switch)
  useEffect(() => {
    setTranslations([])
  }, [items])

  useEffect(() => {
    if (!isJapanese || items.length === 0) return
    if (translations.length > 0) return
    setTranslating(true)
    fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titles: items.map((i) => i.title) }),
    })
      .then((r) => r.json())
      .then((d) => setTranslations(d.translated ?? []))
      .catch(() => {})
      .finally(() => setTranslating(false))
  }, [isJapanese, items])

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        現在表示できるニュースがありません
      </div>
    )
  }

  return (
    <div>
      {translating && (
        <p className="text-xs text-blue-500 mb-3">タイトルを日本語に翻訳中...</p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map((item, i) => (
          <NewsCard
            key={item.id}
            item={item}
            hasBackend={hasBackend}
            displayTitle={isJapanese && translations[i] ? translations[i] : undefined}
          />
        ))}
      </div>
    </div>
  )
}
