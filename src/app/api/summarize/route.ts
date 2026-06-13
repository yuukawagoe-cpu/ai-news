import { NextRequest } from "next/server"

export async function POST(request: NextRequest): Promise<Response> {
  const backendUrl = process.env.PYTHON_API_URL
  if (!backendUrl) {
    return Response.json({ error: "Backend not configured" }, { status: 503 })
  }
  try {
    const body = await request.json()
    const res = await fetch(`${backendUrl}/summarize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    return Response.json(await res.json(), { status: res.status })
  } catch {
    return Response.json({ error: "Summarize failed" }, { status: 500 })
  }
}
