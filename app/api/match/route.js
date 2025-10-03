import { NextResponse } from "next/server"
import { USERS } from "../_stub/data.js"

export const runtime = "nodejs"

// helpers
const logBoost = (n) => Math.min(1.5, Math.log(1 + Math.max(0, n)))
function interestOverlap(theirOffers, myWants) {
  const myCats = new Set((myWants || []).map(w => w.category))
  return (theirOffers || []).reduce((acc, o) => acc + (myCats.has(o.category) ? 1 : 0), 0)
}
function reciprocalOverlap(myOffers, theirWants) {
  const theirCats = new Set((theirWants || []).map(w => w.category))
  return (myOffers || []).reduce((acc, o) => acc + (theirCats.has(o.category) ? 1 : 0), 0)
}

export async function POST(req) {
  const url = new URL(req.url)
  const limitParam = url.searchParams.get("limit")
  const limit = limitParam === "all" ? -1 : (parseInt(limitParam || "", 10) || null)

  try {
    const b = await req.json().catch(() => ({}))
    const userId = parseInt(b.userId, 10)
    const myLocation = (b.myLocation || "").toString()
    const myOffers = b.myOffers || []
    const myWants  = b.myWants  || []

    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 })

    const meCity = (myLocation.split(",")[0] || "").trim().toLowerCase()

    // Hard filter: barter-compatible
    const candidates = USERS
      .filter(u => u.id !== userId)
      .filter(u => interestOverlap(u.offers, myWants) > 0)
      .filter(u => reciprocalOverlap(myOffers, u.wants) > 0)

    const ranked = candidates.map(u => {
      const availability = Math.min(3, Math.max(0, u.availability || 0))
      const align1 = interestOverlap(u.offers, myWants)      // they offer what I want
      const align2 = reciprocalOverlap(myOffers, u.wants)    // they want what I offer
      const locMatch = meCity && u.location.toLowerCase().startsWith(meCity) ? 1 : 0
      const reputation = (u.avgStars || 0) + logBoost(u.ratingCount || 0)

      const total = 5.0*availability + 3.0*align1 + 2.0*align2 + 1.5*locMatch + 1.0*reputation + (u.verified ? 0.5 : 0)
      return {
        userId: u.id,
        name: u.name,
        location: u.location,
        verified: !!u.verified,
        availability, align1, align2, locMatch, reputation,
        totalScore: Number(total.toFixed(3)),
      }
    }).sort((a,b)=> b.totalScore - a.totalScore || b.reputation - a.reputation || a.userId - b.userId)

    const out = (limit && limit > 0) ? ranked.slice(0, limit) : ranked
    return NextResponse.json({ matches: out })
  } catch (e) {
    console.error("[match] fatal:", e)
    return NextResponse.json({ error: "internal" }, { status: 500 })
  }
}