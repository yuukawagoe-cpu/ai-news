import { NextRequest } from "next/server"

export async function GET(request: NextRequest): Promise<Response> {
  const authHeader = request.headers.get("authorization")
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const backendUrl = process.env.PYTHON_API_URL?.replace(/^﻿/, "").trim()
  if (!backendUrl) {
    return Response.json({ error: "Backend not configured" }, { status: 503 })
  }

  try {
    const res = await fetch(`${backendUrl}/reindex`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    })
    return Response.json(await res.json(), { status: res.status })
  } catch (e) {
    return Response.json({ error: "Reindex failed", detail: String(e) }, { status: 500 })
  }
}
