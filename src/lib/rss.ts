import { DOMParser } from "@xmldom/xmldom"
import type { Element } from "@xmldom/xmldom"
import type { NewsItem, RssSource, FetchOptions } from "@/lib/types"
import { RSS_SOURCES } from "@/constants/sources"

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 1) + "…"
}

function generateId(url: string): string {
  return Buffer.from(url).toString("base64url")
}

function getTagText(element: Element, tagName: string): string {
  return element.getElementsByTagName(tagName)[0]?.textContent ?? ""
}

function normalizeRssItem(item: Element, source: RssSource): NewsItem | null {
  const title = getTagText(item, "title")
  const link = getTagText(item, "link")
  const dateStr =
    getTagText(item, "pubDate") ||
    getTagText(item, "published") ||
    getTagText(item, "updated")
  const rawDesc =
    getTagText(item, "description") ||
    getTagText(item, "summary") ||
    getTagText(item, "content:encoded")

  if (!title || !link) return null

  const description = truncate(stripHtml(rawDesc), 200)

  let publishedAt: string
  if (!dateStr || isNaN(new Date(dateStr).getTime())) {
    publishedAt = "1970-01-01T00:00:00.000Z"
  } else {
    publishedAt = new Date(dateStr).toISOString()
  }

  const id = generateId(link)

  return { id, title, description, url: link, publishedAt, source: source.name }
}

function parseRssFeed(xml: string, source: RssSource): NewsItem[] {
  const doc = new DOMParser().parseFromString(xml, "text/xml")

  if (doc.getElementsByTagName("parsererror").length > 0) return []

  const items = [
    ...Array.from(doc.getElementsByTagName("item")),
    ...Array.from(doc.getElementsByTagName("entry")),
  ]

  return items
    .map((item) => normalizeRssItem(item as Element, source))
    .filter((item): item is NewsItem => item !== null)
}

async function fetchRssFeed(source: RssSource): Promise<NewsItem[]> {
  try {
    const response = await fetch(source.url, { next: { revalidate: 1800 } })
    if (!response.ok) {
      console.warn(`[RSS] Failed to fetch ${source.name}: ${response.status}`)
      return []
    }
    const xml = await response.text()
    return parseRssFeed(xml, source)
  } catch (err) {
    console.warn(`[RSS] Error fetching ${source.name}:`, err)
    return []
  }
}

export async function fetchAllNews(options?: FetchOptions): Promise<NewsItem[]> {
  const targetSources =
    options?.source && options.source !== "all"
      ? RSS_SOURCES.filter((s) => s.name === options.source)
      : RSS_SOURCES

  const results = await Promise.allSettled(targetSources.map(fetchRssFeed))

  const allItems = results
    .filter(
      (r): r is PromiseFulfilledResult<NewsItem[]> => r.status === "fulfilled"
    )
    .flatMap((r) => r.value)

  const map = new Map<string, NewsItem>()
  for (const item of allItems) {
    if (!map.has(item.id)) map.set(item.id, item)
  }

  return Array.from(map.values())
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, options?.limit ?? 50)
}
