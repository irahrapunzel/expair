import { NextResponse } from "next/server"
import { CATEGORIES } from "../../../lib/categories.js"
import { classifyToOne } from "../../../lib/ai.js"
import { query } from "../../../lib/db.js"

export const runtime = "nodejs"

export async function POST(req) {
  try {
    const b = await req.json().catch(() => ({}))
    const text = (b.text || "").toString().slice(0, 200)
    const tradereqId = Number(b.tradereqId) || null
    if (!text) return NextResponse.json({ error: "text required" }, { status: 400 })

    const category = await classifyToOne(text, CATEGORIES)

    if (tradereqId) {
      try {
        await query(
          `update tradereq_tbl set classifiedcategory = $1 where tradereq_id = $2`,
          [category, tradereqId]
        )
      } catch (e) {
        console.warn("[classify] DB update skipped:", e?.message)
      }
    }

    return NextResponse.json({ category })
  } catch (e) {
    console.error("[classify] fatal:", e)
    return NextResponse.json({ error: "internal" }, { status: 500 })
  }
}