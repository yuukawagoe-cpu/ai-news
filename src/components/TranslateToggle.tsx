"use client"

import { useTranslation } from "@/context/TranslationContext"

export default function TranslateToggle() {
  const { isJapanese, setIsJapanese } = useTranslation()
  return (
    <button
      onClick={() => setIsJapanese(!isJapanese)}
      className={`text-sm px-3 py-1 rounded-full border transition-colors ${
        isJapanese
          ? "bg-blue-600 text-white border-blue-600"
          : "bg-white text-gray-600 border-gray-300 hover:border-blue-400 hover:text-blue-600"
      }`}
    >
      {isJapanese ? "🌐 English" : "🌐 日本語"}
    </button>
  )
}
