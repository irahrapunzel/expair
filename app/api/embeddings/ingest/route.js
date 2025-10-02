import { NextResponse } from 'next/server'
import { ragIngest } from '../../../../lib/rag'
import crypto from 'crypto'

export const runtime = 'nodejs'

export async function POST(req) {
  const b = await req.json().catch(()=> ({}))
  const title = (b.title||'Untitled').toString().slice(0,200)
  const content = (b.content||'').toString()
  const tags = (b.tags||'').toString().slice(0,200)
  const docId = b.docId || crypto.randomUUID()

  await ragIngest({ docId, title, text: content, tags })
  return NextResponse.json({ ok: true, docId })
}