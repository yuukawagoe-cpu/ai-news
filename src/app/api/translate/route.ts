import { NextRequest } from "next/server"

export async function POST(request: NextRequest): Promise<Response> {
  const { titles } = await request.json()
  if (!Array.isArray(titles) || titles.length === 0) {
    return Response.json({ translated: [] })
  }

  const numbered = titles.map((t: string, i: number) => `${i + 1}. ${t}`).join("\n")
  const prompt = `Translate the following English article titles to Japanese. Return ONLY a JSON array of translated strings in the same order. No explanations.\n\nTitles:\n${numbered}\n\nReturn format: ["翻訳1", "翻訳2", ...]`

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 2000,
      }),
    })
    const data = await res.json()
    const content: string = data.choices?.[0]?.message?.content ?? "[]"
    const match = content.match(/\[[\s\S]*\]/)
    const translated: string[] = match ? JSON.parse(match[0]) : titles
    return Response.json({ translated })
  } catch (e) {
    return Response.json({ translated: titles, error: String(e) })
  }
}
