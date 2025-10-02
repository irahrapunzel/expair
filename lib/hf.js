import fetch from 'node-fetch'
import { env } from './env'

// Model: https://huggingface.co/nlptown/bert-base-multilingual-uncased-sentiment (5 classes, 1-5 stars)
const HF_MODEL = 'nlptown/bert-base-multilingual-uncased-sentiment'

export async function textToStarsHF(text) {
  if (!env.hfKey) {
    // simple fallback heuristic if no key
    const s = (text||'').toLowerCase()
    const pos = ['excellent','amazing','great','helpful','thanks','love','fast','perfect','recommend','clear']
    const neg = ['bad','terrible','late','rude','scam',"didn't",'did not','never','waste','slow','poor']
    let score = 3
    if (pos.some(w => s.includes(w))) score++
    if (neg.some(w => s.includes(w))) score--
    return Math.max(1, Math.min(5, score))
  }

  const res = await fetch(`https://api-inference.huggingface.co/models/${HF_MODEL}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.hfKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ inputs: text.slice(0, 512) })
  })
  if (!res.ok) throw new Error(`HF error ${res.status}`)
  const data = await res.json()
  // data: [[{label:"1 star",score:...},...]]
  const top = Array.isArray(data) ? (Array.isArray(data[0]) ? data[0] : data) : []
  const best = top.reduce((a,b)=> (b.score>a.score?b:a), {label:'3 stars',score:0})
  const n = parseInt(best.label, 10)
  if (Number.isFinite(n)) return Math.max(1, Math.min(5, n))
  return 3
}