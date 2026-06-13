import { NextRequest } from "next/server"
import { fetchAllNews } from "@/lib/rss"

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const searchParams = request.nextUrl.searchParams
    const source = searchParams.get("source") ?? undefined
    const limitRaw = Number(searchParams.get("limit"))
    const limit = isNaN(limitRaw) || limitRaw <= 0 ? 50 : limitRaw

    const items = await fetchAllNews({ source, limit })
    return Response.json(items)
  } catch {
    return Response.json({ error: "Failed to fetch news" }, { status: 500 })
  }
}
