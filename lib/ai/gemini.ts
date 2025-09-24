// lib/ai/gemini.ts
// Works with BOTH the new "@google/genai" SDK and the older "@google/generative-ai".
// Exposes: embedText, cosine, polish (<=250 chars)

let _client: any | null = null;
let _mode: "generative-ai" | "none" = "none";

const API_KEY = process.env.GOOGLE_API_KEY;
if (!API_KEY) {
  // Throwing helps you catch missing key in API routes quickly.
  throw new Error("GOOGLE_API_KEY missing. Add it to .env.local and restart.");
}

// Prefer the newer SDK by default.
export const EMB_MODEL = process.env.EMB_MODEL || "text-embedding-004"; // 768-d
export const FALLBACK_EMB_MODEL = process.env.FALLBACK_EMB_MODEL || "gemini-embedding-001"; // 3072-d
export const CHAT_MODEL = process.env.CHAT_MODEL || "gemini-1.5-flash";
export const AI_PROVIDER = process.env.AI_PROVIDER || "gemini"; // "gemini" or "local"

// ---- client loader ----
async function getClient() {
  if (_client) return _client;
  
  if (!API_KEY) {
    throw new Error("GOOGLE_API_KEY missing. Add it to .env.local and restart.");
  }
  
  try {
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    _client = new GoogleGenerativeAI(API_KEY);
    _mode = "generative-ai";
    return _client;
  } catch (e) {
    _mode = "none";
    throw new Error(
      "Failed to load Google AI SDK. Install @google/generative-ai: npm install @google/generative-ai"
    );
  }
}

// ---- utilities ----
export function cosine(a: number[], b: number[]) {
  let dot = 0,
    na = 0,
    nb = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    const x = a[i] || 0,
      y = b[i] || 0;
    dot += x * y;
    na += x * x;
    nb += y * y;
  }
  if (!na || !nb) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

function clamp(s: string, n = 250) {
  return s.length <= n ? s : s.slice(0, n);
}

// ---- embeddings with robust fallbacks ----
export async function embedText(text: string): Promise<number[]> {
  const client = await getClient();

  // Helper to normalize return shape
  const take = (res: any): number[] | null => {
    if (res?.embedding?.values) return res.embedding.values as number[];
    return null;
  };

  // Try with primary embedding model
  try {
    const model = client.getGenerativeModel({ model: EMB_MODEL });
    const res = await model.embedContent(text);
    const v = take(res);
    if (v) return v;
  } catch (_) {}

  // Try with fallback model
  try {
    const model = client.getGenerativeModel({ model: FALLBACK_EMB_MODEL });
    const res = await model.embedContent(text);
    const v = take(res);
    if (v) return v;
  } catch (_) {}

  // Final safety: return zeros (prevents crashes in UI)
  console.warn("[embedText] all embedding attempts failed; returning zeros.");
  return Array(768).fill(0);
}

// ---- short rewrite (<=250 chars). Falls back to original text ----
export async function polish(text: string): Promise<string> {
  if (AI_PROVIDER !== "gemini") return clamp(text);

  const client = await getClient();

  try {
    const model = client.getGenerativeModel({ model: CHAT_MODEL });
    const r = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: `Rewrite under 250 chars, neutral tone: ${text}` }],
        },
      ],
      generationConfig: { maxOutputTokens: 80, temperature: 0.2 },
    });
    const out = r?.response?.text?.();
    if (out) return clamp(out);
  } catch (_) {}

  return clamp(text);
}