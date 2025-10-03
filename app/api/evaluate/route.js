import { NextResponse } from "next/server"

// Try to load AI reasoner; if it fails we'll fall back.
let shortReason = null
try {
  // keep this import — if it fails, we use fallback below
  const ai = await import("../../../lib/ai.js")
  shortReason = ai.shortReason
} catch (e) {
  console.warn("[evaluate] AI module not loaded, will use fallback reason:", e?.message)
}

export const runtime = "nodejs"

// ---- helpers
const clamp5 = (n) => {
  const x = Number.parseInt(n, 10)
  return Math.max(1, Math.min(5, Number.isFinite(x) ? x : 1))
}
const pct = (n) => Math.round((n / 5) * 100)
const labelOf = (n) => (n >= 9 ? "Excellent" : n >= 7 ? "Great" : n >= 5 ? "Good" : n >= 3 ? "Okay" : "Poor")
const fallbackReason = ({ taskcomplexity, timecommitment, skilllevel, context }) => {
  const cues = []
  if (taskcomplexity >= 4) cues.push("complex task")
  if (timecommitment >= 4) cues.push("higher time demand")
  if (skilllevel >= 4) cues.push("advanced skill")
  const parts = cues.length ? cues.join(", ") : "balanced factors"
  const c = context ? ` Context: ${String(context).slice(0,120)}.` : ""
  return `Overall fairness reflects ${parts} across complexity, effort, and proficiency.${c}`.slice(0, 250)
}

// ---- route
export async function POST(req) {
  const url = new URL(req.url)
  const fast = url.searchParams.get("fast") === "1"   // skip LLM if set
  const debug = url.searchParams.get("debug") === "1"

  try {
    const b = await req.json().catch(() => ({}))

    const taskcomplexity = clamp5(b.taskcomplexity)
    const timecommitment = clamp5(b.timecommitment)
    const skilllevel     = clamp5(b.skilllevel)
    const context        = (b.context || "").toString().slice(0, 400)

    // compute meters/overall
    const avg5    = (taskcomplexity + timecommitment + skilllevel) / 3
    const score10 = Math.round(avg5 * 2)
    const overall = { meterPct: pct(avg5), label: labelOf(score10), score10 }
    const meters  = {
      taskcomplexity: pct(taskcomplexity),
      timecommitment: pct(timecommitment),
      skilllevel: pct(skilllevel),
    }

    // robust reasoning: skip or fall back if AI unavailable
    let reasoning
    if (fast || !shortReason) {
      reasoning = fallbackReason({ taskcomplexity, timecommitment, skilllevel, context })
    } else {
      try {
        reasoning = await shortReason({ taskcomplexity, timecommitment, skilllevel, context, histories: [] })
        if (!reasoning || typeof reasoning !== "string") {
          reasoning = fallbackReason({ taskcomplexity, timecommitment, skilllevel, context })
        }
      } catch (e) {
        console.warn("[evaluate] AI reason failed, using fallback:", e?.message)
        reasoning = fallbackReason({ taskcomplexity, timecommitment, skilllevel, context })
      }
    }

    const payload = { overall, meters, reasoning }
    return NextResponse.json(debug ? { ...payload, meta: { usedAI: !!(shortReason && !fast) } } : payload)
  } catch (e) {
    console.error("[evaluate] fatal:", e)
    // even in worst-case parsing failure, return a minimal safe payload
    const tc = 3, tm = 3, sl = 3
    const avg5 = (tc + tm + sl) / 3
    const score10 = Math.round(avg5 * 2)
    return NextResponse.json({
      overall: { meterPct: pct(avg5), label: labelOf(score10), score10 },
      meters: { taskcomplexity: pct(tc), timecommitment: pct(tm), skilllevel: pct(sl) },
      reasoning: "Fallback response produced due to an input error.",
      meta: debug ? { error: e?.message } : undefined
    }, { status: 200 })
  }
}