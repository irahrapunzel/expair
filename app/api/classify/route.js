import { NextResponse } from 'next/server'
import { CATEGORIES } from '../../../lib/categories'
import { classifyToOne } from '../../../lib/ai'
import { query } from '../../../lib/db'

export const runtime = 'nodejs'

export async function POST(req) {
  const body = await req.json().catch(()=> ({}))
  const text = (body.text||'').toString().slice(0, 200)
  const tradeReqId = Number(body.tradereqId) || null

  const category = await classifyToOne(text, CATEGORIES)

  // Optional: write back when tradeReq_id provided
  if (tradeReqId) {
    // Column exists as "classifiedCategory" in tradeReq_tbl
    await query(`update tradeReq_tbl set classifiedCategory = $1 where tradeReq_id = $2`, [category, tradeReqId])
  }

  return NextResponse.json({ category })
}