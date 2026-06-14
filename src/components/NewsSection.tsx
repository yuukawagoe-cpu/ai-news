import { fetchAllNews } from "@/lib/rss"
import NewsList from "@/components/NewsList"

export default async function NewsSection({ source }: { source: string }) {
  const items = await fetchAllNews({ source })
  const hasBackend = !!process.env.PYTHON_API_URL
  return <NewsList items={items} hasBackend={hasBackend} />
}
