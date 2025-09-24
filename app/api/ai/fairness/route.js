// app/api/ai/fairness/route.js
import { NextResponse } from "next/server";

// Health check
export async function GET() {
  return NextResponse.json({ ok: true });
}

const LVL = { Beginner:1, Intermediate:2, Advanced:3, Certified:4 };
const typePts = (t) => t==="Project"?300 : t==="Service"?150 : 100;
const modePts = (m) => m==="Hybrid"?150 : m==="Onsite"?100 : 75;
const lvlPts  = (l) => [0,50,100,150,200][LVL[l]||2];
const clamp   = (v,min=0,max=100)=> Math.max(min, Math.min(max, v));

export async function POST(req) {
  let body = {};
  try { body = await req.json(); } catch {}
  const { lhs, rhs } = body;

  if (!lhs || !rhs) {
    return NextResponse.json({ error:"lhs & rhs required" }, { status:400 });
  }

  // Complexity score per side (0..100)
  const cxScore = (x)=>{
    const raw = lvlPts(x.level) + typePts(x.type||"Service") + modePts(x.mode||"Online");
    return clamp((raw / (200+300+150)) * 100);
  };

  // Time “effective minutes” rises with level (0..inf), we convert to 0..100 balance
  const mEff = (x)=> (x.minutes||0) * (1 + 0.1*((LVL[x.level]||2)-1));

  const Lcx = cxScore(lhs), Rcx = cxScore(rhs);
  const task_complexity = clamp(100 - Math.abs(Lcx - Rcx));

  const Lm = mEff(lhs), Rm = mEff(rhs);
  const time_commitment = clamp(100 - (100 * Math.abs(Lm - Rm) / Math.max(Lm, Rm, 1)));

  const level_gap = Math.abs((LVL[lhs.level]||2) - (LVL[rhs.level]||2));
  const skill_level = clamp(100 - 33.3 * level_gap);

  const overall = Math.round((task_complexity + time_commitment + skill_level)/3);
  const label = overall>=70 ? "Good trade" : overall>=50 ? "Average trade" : "Bad trade";

  // Short narrative (<=250 chars). We’ll try Gemini to polish; fallback to template.
  let provider = "math";
  let what = `Overall ${label.toLowerCase()}. Time ${Math.round(time_commitment)}, Skill ${Math.round(skill_level)}, Complexity ${Math.round(task_complexity)}. Adjust minutes on the higher side to close the gap.`;
  if (process.env.GOOGLE_API_KEY) {
    try {
      const { GoogleGenerativeAI } = await import("@google/generative-ai");
      const client = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
      const model = client.getGenerativeModel({ model: process.env.CHAT_MODEL || "gemini-1.5-flash" });
      const r = await model.generateContent({
        contents: [{ role:"user", parts:[{ text:
          `Rewrite under 250 chars, neutral tone, no emojis: ${what}` }] }],
        generationConfig: { maxOutputTokens: 80, temperature: 0.2 }
      });
      const txt = r?.response?.text?.();
      if (txt) { what = txt.slice(0,250); provider = "gemini"; }
    } catch {
      // keep template + provider="math"
    }
  }

  return NextResponse.json({
    provider,
    meters: {
      task_complexity: Math.round(task_complexity),
      time_commitment: Math.round(time_commitment),
      skill_level: Math.round(skill_level)
    },
    overall,
    label,
    what_we_think: what
  });
}