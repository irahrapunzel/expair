import { NextResponse } from "next/server"
import { textToStarsHF } from "../../../lib/hf.js"
import { query } from "../../../lib/db.js"

export const runtime = "nodejs"

export async function POST(req) {
  try {
    const b = await req.json().catch(() => ({}))
    const feedback = (b.feedback || "").toString().slice(0, 1000)
    const tradereqId = Number(b.tradereqId) || null
    const raterId = Number(b.raterId) || null
    const rateeId = Number(b.rateeId) || null
    const role = ((b.role || "requester") + "").toLowerCase() // 'requester' | 'responder'

    if (!feedback) return NextResponse.json({ error: "feedback required" }, { status: 400 })

    const stars = await textToStarsHF(feedback)

    if (tradereqId && raterId && rateeId) {
      // try lower_snake first (most common)
      try {
        const col = role === "responder" ? "responder_starcount" : "requester_starcount"
        await query(
          `insert into repsys_tbl (tradereq_id, requester_id, responder_id, ${col}, comments)
           values ($1,$2,$3,$4,$5)
           on conflict (tradereq_id, requester_id, responder_id) do update set
             ${col} = excluded.${col}, comments = excluded.comments`,
          [tradereqId, raterId, rateeId, stars, feedback.slice(0,150)]
        )
      } catch (e) {
        // fallback to possible camelCase variants
        try {
          const col = role === "responder" ? `"responder_starCount"` : `"requester_starCount"`
          await query(
            `insert into "repSys_tbl" ("tradeReq_id","requester_id","responder_id", ${col}, "comments")
             values ($1,$2,$3,$4,$5)
             on conflict ("tradeReq_id","requester_id","responder_id") do update set
               ${col} = excluded.${col}, "comments" = excluded."comments"`,
            [tradereqId, raterId, rateeId, stars, feedback.slice(0,150)]
          )
        } catch (e2) {
          console.warn("[text-to-stars] DB write skipped:", e?.message || e2?.message)
        }
      }

      // optional: aggregate update (best-effort; ignore errors)
      try {
        await query(`
          with agg as (
            select
              $1::int as user_id,
              count(*) filter (where ratee_id = $1) as cnt,
              avg(
                case
                  when ratee_id = $1 and requester_starcount is not null then requester_starcount
                  when ratee_id = $1 and responder_starcount is not null then responder_starcount
                end
              ) as avg
            from repsys_tbl
          )
          update users_tbl u
             set ratingcount = coalesce(agg.cnt,0),
                 avgstars = case when coalesce(agg.cnt,0) > 0 then round(coalesce(agg.avg,0)::numeric,2) else 0 end
          from agg
         where u.user_id = agg.user_id;`, [rateeId])
      } catch (e3) {
        console.warn("[text-to-stars] aggregate skipped:", e3?.message)
      }
    }

    return NextResponse.json({ stars })
  } catch (e) {
    console.error("[text-to-stars] fatal:", e)
    return NextResponse.json({ error: "internal" }, { status: 500 })
  }
}