import { NextResponse } from "next/server"
import crypto from "crypto"
import { ragIngest } from "../../../../lib/rag.js"

export const runtime = "nodejs"

export async function POST(req) {
  try {
    const b = await req.json().catch(() => ({}))
    const title = (b.title || "Untitled").toString().slice(0, 200)
    const content = (b.content || "").toString()
    const tags = (b.tags || "").toString().slice(0, 200)
    const docId = b.docId || crypto.randomUUID()
    await ragIngest({ docId, title, text: content, tags })
    return NextResponse.json({ ok: true, docId })
  } catch (e) {
    console.error("[embeddings/ingest] fatal:", e)
    return NextResponse.json({ error: "internal" }, { status: 500 })
  }
}