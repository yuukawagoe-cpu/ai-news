import { fetchAllNews } from "@/lib/rss"
import NewsList from "@/components/NewsList"

export default async function NewsSection({ source }: { source: string }) {
  const items = await fetchAllNews({ source })
  return <NewsList items={items} />
}
