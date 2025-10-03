import { NextResponse } from "next/server"
import { ragSearch } from "../../../../lib/rag.js"
import { env } from "../../../../lib/env.js"
import { GoogleGenerativeAI } from "@google/generative-ai"

export const runtime = "nodejs"

export async function POST(req) {
  try {
    const b = await req.json().catch(() => ({}))
    const q = (b.query || "").toString().slice(0, 500)
    const limit = parseInt(b.limit || "8", 10)
    const hits = await ragSearch(q, limit)

    let answer = null
    if (b.answer === true && env.geminiKey) {
      const client = new GoogleGenerativeAI(env.geminiKey)
      const model = client.getGenerativeModel({ model: env.geminiReason })
      const ctx = hits.map((h,i)=>`[${i+1}] ${h.title || "doc"} — ${h.content}`).join("\n")
      const prompt = `Use ONLY the CONTEXT to answer the QUERY concisely.
CONTEXT:
${ctx}

QUERY: ${q}
ANSWER:`
      const res = await model.generateContent(prompt)
      answer = (res.response.text() || "").trim()
    }

    return NextResponse.json({ hits, answer })
  } catch (e) {
    console.error("[rag/query] fatal:", e)
    return NextResponse.json({ error: "internal" }, { status: 500 })
  }
}