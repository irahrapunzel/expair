// app/api/ai/match/route.js
import { NextResponse } from "next/server";

/**
 * TEMP seed so you can demo right now.
 * Replace this array with reading a file or BE endpoint later.
 */
const CANDIDATES = [
  {
    userId: "U5",
    name: "Ana",
    city: "Manila",
    mode: "Online Sync",
    availability: ["weeknights"],
    reputation: { stars: 4.8, completed: 18, level: 12 },
    generalSkills: ["Languages & Translation"],
    offers: [
      { skill: "Language Tutoring", level: "Intermediate", minutesDefault: 60 },
      { skill: "Translation", level: "Advanced", minutesDefault: 90, specialized: true }
    ]
  },
  {
    userId: "U7",
    name: "Rafael",
    city: "Quezon City",
    mode: "Online Async",
    availability: ["weeknights","weekends"],
    reputation: { stars: 4.6, completed: 9, level: 9 },
    generalSkills: ["Education & Training"],
    offers: [
      { skill: "Tutoring", level: "Intermediate", minutesDefault: 60 },
      { skill: "Curriculum Development", level: "Advanced", minutesDefault: 120 }
    ]
  },
  // add a few more from your FE’s hardcoded lists if you want
];

// --- tiny helpers (no deps) ---
const toks = s => (s||"").toLowerCase().split(/\W+/).filter(Boolean);
const jaccard = (a,b) => {
  const A = new Set(toks(a)), B = new Set(toks(b));
  const inter = [...A].filter(x=>B.has(x)).length;
  const uni = new Set([...A,...B]).size || 1;
  return inter / uni; // 0..1
};
const availOverlap = (a=[],b=[]) => {
  const A=new Set(a),B=new Set(b);
  const inter=[...A].filter(x=>B.has(x)).length;
  const uni=new Set([...A,...B]).size||1;
  return inter/uni;
};

// For quick “is the route alive?” check
export async function GET() {
  return NextResponse.json({ ok:true, count: CANDIDATES.length });
}

export async function POST(req) {
  let body = {};
  try { body = await req.json(); } catch {}
  const { request_text = "", requester_user_id = "Ume", top_k = 8 } = body;

  if (!request_text) {
    return NextResponse.json({ error: "request_text required" }, { status: 400 });
  }

  const rows = CANDIDATES.map(c => {
    // best offer match for this candidate
    let bestSim = 0;
    for (const o of (c.offers||[])) {
      const offerText = `${o.skill} ${o.level} ${c.city||""} ${(c.availability||[]).join(" ")} ${(c.generalSkills||[]).join(" ")}`;
      const sim = jaccard(request_text, offerText); // fallback similarity (no credits)
      if (sim > bestSim) bestSim = sim;
    }

    // simple boosts (you can expand later)
    const availB = 0.10 * availOverlap(["weeknights"], c.availability||[]);
    const distB  = (c.mode?.startsWith("Online")) ? 0.05 : 0.0;
    const repB   = 0.05 * ((c.reputation?.stars ?? 4)/5);

    const score = Math.max(0, Math.min(1, 0.55*bestSim + availB + distB + repB));

    return {
      user_id: c.userId,
      display_name: c.name,
      match_score: +score.toFixed(3),
      reasons: [
        bestSim>=0.7 ? "High semantic similarity"
        : bestSim>=0.5 ? "Good semantic similarity"
        : "Related skills",
        (availB>0 ? "Availability overlaps" : null),
        (distB>0 ? "Online compatible" : null),
        ((c.reputation?.stars??0) ? `Reputation ${c.reputation.stars}★` : null)
      ].filter(Boolean),
      preview: {
        can_offer: (c.offers||[]).map(o=>o.skill),
        category: (c.generalSkills||[])[0] || null,
        specific_skills: (c.offers||[]).map(o=>o.skill)
      }
    };
  })
  .sort((a,b)=>b.match_score-a.match_score)
  .slice(0, top_k);

  return NextResponse.json({ provider: "local", candidates: rows });
}