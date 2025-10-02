import { NextResponse } from 'next/server'
import { shortReason } from '../../../lib/ai'
import { query } from '../../../lib/db'

export const runtime = 'nodejs'

const labelOf = (n)=> n>=9?'Excellent': n>=7?'Great': n>=5?'Good': n>=3?'Okay':'Poor'

export async function POST(req) {
  const b = await req.json().catch(()=> ({}))
  const tradereqId = Number(b.tradereqId) || null
  const taskcomplexity = clampInt(b.taskcomplexity, 1, 5)
  const timecommitment = clampInt(b.timecommitment, 1, 5)
  const skilllevel = clampInt(b.skilllevel, 1, 5)
  const context = (b.context||'').toString().slice(0, 400)

  // (optional) Pull a few past contexts for RAG-style flavor from your histories when you have them
  const histories = []

  const avg5 = (taskcomplexity + timecommitment + skilllevel)/3
  const score10 = Math.round(avg5*2)
  const meterPct = Math.round((avg5/5)*100)
  const label = labelOf(score10)

  const reasoning = await shortReason({ taskcomplexity, timecommitment, skilllevel, context, histories })

  // Write to evaluation_tbl if you want to persist (columns exist)
  if (tradereqId) {
    await query(
      `insert into evaluation_tbl (tradeReq_id, evaluationDescription, taskComplexity, timeCommitment, skillLevel)
       values ($1,$2,$3,$4,$5)
       on conflict (tradeReq_id) do update set
         evaluationDescription = excluded.evaluationDescription,
         taskComplexity = excluded.taskComplexity,
         timeCommitment = excluded.timeCommitment,
         skillLevel = excluded.skillLevel`,
      [tradereqId, reasoning, taskcomplexity, timecommitment, skilllevel]
    )
  }

  const payload = {
    overall: { meterPct, label, score10 },
    meters: {
      taskcomplexity: Math.round(taskcomplexity/5*100),
      timecommitment: Math.round(timecommitment/5*100),
      skilllevel: Math.round(skilllevel/5*100),
    },
    reasoning
  }
  const debug = new URL(req.url).searchParams.get('debug') === '1'
  return NextResponse.json(debug ? { ...payload, meta: { source: 'gemini' } } : payload)
}

function clampInt(n, min, max) {
  n = parseInt(n,10)
  if (!Number.isFinite(n)) n = min
  return Math.max(min, Math.min(max, n))
}