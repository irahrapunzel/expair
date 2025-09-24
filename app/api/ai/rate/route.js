// app/api/ai/rate/route.js
import { NextResponse } from "next/server";

// --- quick health check ---
export async function GET() {
  return NextResponse.json({ ok: true });
}

// --- tiny heuristic (fallback when Gemini isn't available) ---
const POS = [
  "great","excellent","on time","on-time","responsive","helpful","high quality",
  "amazing","clear","polite","professional","early","creative","accurate",
  "fast","quick","friendly","recommend","recommendation","well done","satisfied"
];
const NEG = [
  "late","rude","poor","low quality","confusing","unresponsive","didn't","did not",
  "missing","delay","delayed","buggy","wrong","bad","terrible","no show","no-show",
  "cancelled","scam","incomplete","unprofessional","unclear","slow"
];

function tagsFrom(text) {
  const t = text.toLowerCase();
  const tags = [];
  if (t.includes("on time") || t.includes("on-time") || t.includes("early")) tags.push("on-time");
  if (t.includes("responsive") || t.includes("reply")) tags.push("responsive");
  if (t.includes("quality") || t.includes("accurate") || t.includes("clean")) tags.push("quality");
  if (t.includes("clear") || t.includes("communication")) tags.push("communication");
  if (t.includes("professional")) tags.push("professionalism");
  if (t.includes("creative")) tags.push("creativity");
  if (t.includes("fast") || t.includes("quick")) tags.push("speed");
  if (t.includes("late") || t.includes("delay")) tags.push("late");
  if (t.includes("unresponsive")) tags.push("unresponsive");
  if (t.includes("buggy") || t.includes("wrong")) tags.push("rework");
  return Array.from(new Set(tags)).slice(0, 5);
}

function heuristicScore(text) {
  const t = (text || "").toLowerCase();
  let s = 0;
  POS.forEach(w => t.includes(w) && (s += 1));
  NEG.forEach(w => t.includes(w) && (s -= 1));
  // crude “not good / not great” handling
  if (t.includes("not great") || t.includes("not good")) s -= 1;

  const stars = Math.min(5, Math.max(1, 3 + Math.round(s / 2)));
  const confidence = Math.min(0.95, 0.6 + Math.abs(s) * 0.1);
  return { stars, confidence: +confidence.toFixed(2), tags: tagsFrom(text) };
}

// --- POST: classify review text into stars ---
export async function POST(req) {
  let body = {};
  try { body = await req.json(); } catch {}
  const { text = "" } = body;

  if (!text.trim()) {
    return NextResponse.json({ error: "text required" }, { status: 400 });
  }

  // If Gemini key exists, try model; otherwise use heuristic
  const key = process.env.GOOGLE_API_KEY;
  if (!key) {
    const h = heuristicScore(text);
    return NextResponse.json({ provider: "heuristic", ...h });
  }

  // Try Gemini (safe fallback to heuristic on any error)
  try {
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const client = new GoogleGenerativeAI(key);
    const modelName = process.env.CHAT_MODEL || "gemini-1.5-flash";
    const model = client.getGenerativeModel({ model: modelName });

    const prompt = `
You are a strict rater. Read the review and output a compact JSON object ONLY:
{"stars":1..5,"confidence":0..1,"tags":["optional","keywords"]}

Rules:
- stars is integer 1..5
- confidence is 0..1 (e.g., 0.82)
- tags are 1–5 short keywords like ["on-time","responsive","quality"]
- No extra text.

Review:
"""${text}"""
    `.trim();

    const r = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 80, temperature: 0 }
    });

    const outText = r?.response?.text?.() || "";
    const jsonLike = outText.match(/\{[\s\S]*\}/)?.[0];
    if (jsonLike) {
      const parsed = JSON.parse(jsonLike);
      // sanitize
      let stars = Math.round(Number(parsed.stars) || 0);
      stars = Math.min(5, Math.max(1, stars));
      let conf = Number(parsed.confidence);
      if (!isFinite(conf)) conf = 0.8;
      const tags = Array.isArray(parsed.tags) ? parsed.tags.slice(0, 5) : tagsFrom(text);
      return NextResponse.json({ provider: "gemini", stars, confidence: +conf.toFixed(2), tags });
    }
  } catch (e) {
    // fall through to heuristic
  }

  const h = heuristicScore(text);
  return NextResponse.json({ provider: "heuristic", ...h });
}