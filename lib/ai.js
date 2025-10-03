import { GoogleGenerativeAI } from "@google/generative-ai"
import { env } from "./env.js"

function client() {
  if (!env.geminiKey) throw new Error("GEMINI_API_KEY missing")
  return new GoogleGenerativeAI(env.geminiKey)
}

export async function classifyToOne(text, labels) {
  try {
    const model = client().getGenerativeModel({ model: env.geminiFast })
    const prompt = `You are a strict SINGLE-LABEL classifier. Choose EXACTLY one label from the list and return ONLY the label text.
Labels:
${labels.join("\n")}
Text: "${text}"
Answer:`
    const res = await model.generateContent(prompt)
    const out = (res.response.text() || "").trim()
    const hit = labels.find(l => out.toLowerCase().includes(l.toLowerCase()))
    return hit || keywordFallback(text, labels)
  } catch {
    return keywordFallback(text, labels)
  }
}

export async function shortReason({ taskcomplexity, timecommitment, skilllevel, context, histories = [] }) {
  const px = [
    "Assess whether this skill-for-skill trade is fair.",
    `Meters (1-5): Task Complexity=${taskcomplexity}, Time=${timecommitment}, Skill=${skilllevel}.`,
    "Write ONE neutral sentence (<=250 chars).",
    context ? `Context: ${context}` : "",
    histories.length ? `Similar cases: ${histories.slice(0,3).join(" | ")}` : "",
    "Answer:",
  ].filter(Boolean).join("\n")

  try {
    const model = client().getGenerativeModel({ model: env.geminiFast })
    const res = await model.generateContent(px)
    return (res.response.text() || "").trim().replace(/\s+/g, " ").slice(0, 250)
  } catch {
    return "Assessment balances complexity, time, and proficiency into an overall fair value."
  }
}

export async function embedText(text) {
  const m = client().getGenerativeModel({ model: env.geminiEmbed })
  // SDK supports both signatures; use the safe content object:
  const res = await m.embedContent({ content: { parts: [{ text }] } })
  return (res.embedding?.values || res.response?.embedding?.values || []).map(Number)
}

function keywordFallback(text, labels) {
  const s = (text || "").toLowerCase()
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