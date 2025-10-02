import { NextResponse } from 'next/server'
import { rankMatches } from '../../../lib/ranking'

export const runtime = 'nodejs'

export async function POST(req) {
  const b = await req.json().catch(()=> ({}))
  const userId = parseInt(b.userId, 10)
  const myLocation = (b.myLocation||'').toString()

  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

  const matches = await rankMatches({ userId, myCity: myLocation })
  return NextResponse.json({ matches })
}