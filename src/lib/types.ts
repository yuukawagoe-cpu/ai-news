export interface NewsItem {
  id: string
  title: string
  description: string
  url: string
  publishedAt: string
  source: string
}

export interface RssSource {
  url: string
  name: string
}

export interface FetchOptions {
  source?: string
  limit?: number
}
