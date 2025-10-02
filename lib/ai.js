import { GoogleGenerativeAI } from '@google/generative-ai'
import { env } from './env'

function client() {
  return new GoogleGenerativeAI(env.geminiKey)
}

export async function classifyToOne(text, labels) {
  // If no key, fall back to keyword heuristic
  if (!env.geminiKey) return simpleKeywordClassify(text, labels)
  const model = client().getGenerativeModel({ model: env.geminiFast })
  const prompt = `You are a strict SINGLE-LABEL classifier. Choose EXACTLY one label from the list and return ONLY the label text.

Labels:
${labels.join('\n')}

Text: "${text}"
Answer:`
  try {
    const res = await model.generateContent(prompt)
    const out = res.response.text().trim()
    const match = labels.find(l => out.toLowerCase().includes(l.toLowerCase()))
    return match || simpleKeywordClassify(text, labels)
  } catch (e) {
    return simpleKeywordClassify(text, labels)
  }
}

export async function shortReason({ taskcomplexity, timecommitment, skilllevel, context, histories }) {
  const base = `In <=250 characters, explain overall fairness considering:
- Task Complexity: ${taskcomplexity}/5
- Time Commitment: ${timecommitment}/5
- Skill Level: ${skilllevel}/5
Context: ${context || 'n/a'}
Similar cases: ${(histories && histories.length) ? histories.join(' | ') : 'n/a'}`
  if (!env.geminiKey) return fallbackReason({ taskcomplexity, timecommitment, skilllevel })
  try {
    const model = client().getGenerativeModel({ model: env.geminiFast })
    const res = await model.generateContent(base)
    return res.response.text().trim().slice(0, 250)
  } catch {
    return fallbackReason({ taskcomplexity, timecommitment, skilllevel })
  }
}

export async function embedText(text) {
  if (!env.geminiKey) throw new Error('GEMINI_API_KEY missing for embeddings')
  // As of Gemini SDK, embeddings are via getGenerativeModel with an embedding model id:
  const model = client().getGenerativeModel({ model: env.geminiEmbed })
  const res = await model.embedContent(text)
  // SDK returns { embedding: { values: number[] } }
  return res.embedding?.values || res.response?.embedding?.values || []
}

// --- local fallbacks / helpers ---

function fallbackReason({ taskcomplexity, timecommitment, skilllevel }) {
  const cues = []
  if (taskcomplexity >= 4) cues.push('complex task')
  if (timecommitment >= 4) cues.push('high time demand')
  if (skilllevel >= 4) cues.push('advanced skill')
  const parts = cues.length ? cues.join(', ') : 'balanced requirements'
  return `Assessment balances ${parts}; overall fairness reflects combined complexity, effort, and proficiency.`.slice(0, 250)
}

function simpleKeywordClassify(text, labels) {
  const s = (text || '').toLowerCase()
  const map = {
    design: "Creative & Design",
    logo: "Creative & Design",
    website: "Technical & IT",
    code: "Technical & IT",
    debug: "Technical & IT",
    manage: "Business & Management",
    marketing: "Business & Management",
    write: "Communication & Interpersonal",
    copy: "Communication & Interpersonal",
    fitness: "Health & Wellness",
    diet: "Health & Wellness",
    calculus: "Education & Training",
    tutor: "Education & Training",
    cleaning: "Home & Lifestyle",
    repair: "Handiwork & Maintenance",
    tiktok: "Digital & Social Media",
    translate: "Language & Translation",
    budget: "Financial & Accounting",
    audit: "Financial & Accounting",
    sports: "Sports & Fitness",
    guitar: "Arts & Performance",
    culture: "Culture & Diversity",
    research: "Research & Critical Thinking",
  }
  for (const k of Object.keys(map)) {
    if (s.includes(k) && labels.includes(map[k])) return map[k]
  }
  return labels[0]
}