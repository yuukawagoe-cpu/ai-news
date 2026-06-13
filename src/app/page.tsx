import { Suspense } from "react"
import { RSS_SOURCES } from "@/constants/sources"
import Header from "@/components/Header"
import FilterBar from "@/components/FilterBar"
import NewsSection from "@/components/NewsSection"
import NewsGridSkeleton from "@/components/NewsGridSkeleton"

export default function Page({
  searchParams,
}: {
  searchParams?: { source?: string | string[] }
}) {
  const rawSource = searchParams?.source
  const normalized: string =
    (Array.isArray(rawSource) ? rawSource[0] : rawSource) ?? "all"
  const source: string = RSS_SOURCES.some((s) => s.name === normalized)
    ? normalized
    : "all"
  const sources = RSS_SOURCES.map((s) => s.name)

  return (
    <main>
      <Header />
      <div className="px-4 py-4">
        <FilterBar sources={sources} selected={source} />
      </div>
      <div className="px-4 py-4">
        <Suspense fallback={<NewsGridSkeleton />}>
          <NewsSection source={source} />
        </Suspense>
      </div>
    </main>
  )
}
