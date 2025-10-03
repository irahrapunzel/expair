import { env } from "./env.js"

// HF model returns "1 star".."5 stars"
const HF_MODEL = "nlptown/bert-base-multilingual-uncased-sentiment"

export async function textToStarsHF(text) {
  // fallback if no token: heuristic 1..5
  if (!env.hfKey) {
    const s = (text || "").toLowerCase()
    const pos = ["excellent","amazing","great","helpful","thanks","love","fast","perfect","recommend","clear"]
    const neg = ["bad","terrible","late","rude","scam","didn't","did not","never","waste","slow","poor"]
    let score = 3
    if (pos.some(w => s.includes(w))) score++
    if (neg.some(w => s.includes(w))) score--
    return Math.max(1, Math.min(5, score))
  }

  const r = await fetch(`https://api-inference.huggingface.co/models/${HF_MODEL}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.hfKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ inputs: (text || "").slice(0, 512) })
  })
  if (!r.ok) throw new Error(`HF ${r.status}`)
  const data = await r.json()
  const arr = Array.isArray(data) ? (Array.isArray(data[0]) ? data[0] : data) : []
  const best = arr.reduce((a,b)=> b.score>(a?.score||0)?b:a, null)
  const n = parseInt(best?.label || "3", 10)
  return Math.max(1, Math.min(5, Number.isFinite(n) ? n : 3))
}