import { NextResponse } from 'next/server'
import { ragSearch } from '../../../../lib/rag'
import { env } from '../../../../lib/env'
import { GoogleGenerativeAI } from '@google/generative-ai'

export const runtime = 'nodejs'

export async function POST(req) {
  const b = await req.json().catch(()=> ({}))
  const q = (b.query||'').toString().slice(0,500)
  const topK = parseInt(b.limit||env.ragTopK,10)

  const hits = await ragSearch(q, topK)

  let answer = null
  if (b.answer === true && env.geminiKey) {
    const client = new GoogleGenerativeAI(env.geminiKey)
    const model = client.getGenerativeModel({ model: env.geminiReason })
    const context = hits.map((h,i)=>`[${i+1}] ${h.title || 'doc'} — ${h.content}`).join('\n')
    const prompt = `Use only the CONTEXT to answer the QUERY concisely.

CONTEXT:
${context}

QUERY: ${q}
ANSWER:`
    const res = await model.generateContent(prompt)
    answer = res.response.text().trim()
  }

  return NextResponse.json({ hits, answer })
}