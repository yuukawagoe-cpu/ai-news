import { NextRequest } from "next/server"

export async function GET(request: NextRequest): Promise<Response> {
  const backendUrl = process.env.PYTHON_API_URL?.replace(/^﻿/, "").trim()
  if (!backendUrl) {
    return Response.json({ error: "Backend not configured" }, { status: 503 })
  }
  const limit = request.nextUrl.searchParams.get("limit") ?? "3"
  try {
    const res = await fetch(`${backendUrl}/trending?limit=${limit}`, {
      next: { revalidate: 1800 },
    })
    return Response.json(await res.json(), { status: res.status })
  } catch (e) {
    return Response.json({ error: "Trending failed", detail: String(e) }, { status: 500 })
  }
}
