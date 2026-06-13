import Header from "@/components/Header"
import FilterBarSkeleton from "@/components/FilterBarSkeleton"
import NewsGridSkeleton from "@/components/NewsGridSkeleton"

export default function Loading() {
  return (
    <main>
      <Header />
      <div className="px-4 py-4">
        <FilterBarSkeleton />
      </div>
      <div className="px-4 py-4">
        <NewsGridSkeleton />
      </div>
    </main>
  )
}
