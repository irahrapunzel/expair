export const env = {
  dbUrl: process.env.DATABASE_URL,
  geminiKey: process.env.GEMINI_API_KEY,
  geminiFast: process.env.GEMINI_FAST_MODEL || 'gemini-2.5-flash',
  geminiReason: process.env.GEMINI_REASON_MODEL || 'gemini-2.5-pro',
  geminiEmbed: process.env.GEMINI_EMBED_MODEL || 'gemini-embedding-001',
  hfKey: process.env.HUGGINGFACE_API_KEY,
  ragTopK: parseInt(process.env.RAG_TOP_K || '8', 10),
  vecDim: parseInt(process.env.PGVECTOR_DIM || '768', 10),
}

export function assertEnv() {
  if (!env.dbUrl) console.warn('[env] DATABASE_URL missing')
  if (!env.geminiKey) console.warn('[env] GEMINI_API_KEY missing — endpoints will still run but without LLM features')
}