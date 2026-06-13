"use client"

import { useRouter } from "next/navigation"

interface FilterBarProps {
  sources: string[]
  selected: string
}

export default function FilterBar({ sources, selected }: FilterBarProps) {
  const router = useRouter()

  return (
    <div role="tablist" className="flex gap-2 flex-wrap">
      <button
        role="tab"
        aria-selected={selected === "all"}
        onClick={() => router.push("/")}
        className={`px-4 py-1.5 rounded-full text-sm transition-colors ${
          selected === "all"
            ? "bg-blue-600 text-white font-bold"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }`}
      >
        すべて
      </button>
      {sources.map((name) => (
        <button
          key={name}
          role="tab"
          aria-selected={selected === name}
          onClick={() => router.push(`/?source=${encodeURIComponent(name)}`)}
          className={`px-4 py-1.5 rounded-full text-sm transition-colors ${
            selected === name
              ? "bg-blue-600 text-white font-bold"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {name}
        </button>
      ))}
    </div>
  )
}
