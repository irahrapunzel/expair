import { NextResponse } from 'next/server'
import { textToStarsHF } from '../../../lib/hf'
import { query } from '../../../lib/db'

export const runtime = 'nodejs'

export async function POST(req) {
  const b = await req.json().catch(()=> ({}))
  const feedback = (b.feedback||'').toString().slice(0, 1000)
  const tradereqId = Number(b.tradereqId) || null
  const raterId = Number(b.raterId) || null
  const rateeId = Number(b.rateeId) || null
  const role = (b.role||'requester').toLowerCase() // 'requester' or 'responder'

  const stars = await textToStarsHF(feedback)

  // Optional DB write: choose which column to populate on repSys_tbl
  // Your schema includes requester/responder star columns
  if (tradereqId && raterId && rateeId) {
    const col = role === 'responder' ? 'responder_starCount' : 'requester_starCount'
    await query(
      `insert into repSys_tbl (tradeReq_id, requester_id, responder_id, ${col}, comments)
       values ($1,$2,$3,$4,$5)
       on conflict (tradeReq_id, requester_id, responder_id) do update set
         ${col} = excluded.${col},
         comments = excluded.comments`,
      [tradereqId, raterId, rateeId, stars, feedback.slice(0,150)]
    )

    // Optional: update aggregates in users_tbl (avgStars, ratingCount) if you maintain them
    await query(`
      update users_tbl u set
        ratingCount = sub.cnt,
        avgStars = case when sub.cnt>0 then round(sub.avg::numeric, 2) else 0 end
      from (
        select ratee_id, count(*) cnt, avg(coalesce(requester_starCount, responder_starCount)) avg
        from repSys_tbl
        where ratee_id = $1
        group by ratee_id
      ) sub
      where u.user_id = sub.ratee_id;`, [rateeId])
  }

  return NextResponse.json({ stars })
}