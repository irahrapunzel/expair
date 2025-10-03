import { query } from "./db.js"
import { embedText } from "./ai.js"

export async function ragIngest({ docId, title, text, tags }) {
  const v = await embedText(text)
  if (!v.length) throw new Error("empty embedding")
  const lit = `[${v.map(x => Number(x).toFixed(6)).join(",")}]`
  await query("begin")
  try {
    await query(
      `insert into rag_docs (doc_id, title, tags)
       values ($1,$2,$3)
       on conflict (doc_id) do update set title=excluded.title, tags=excluded.tags`,
      [docId, title, tags || null]
    )
    await query(
      `insert into rag_chunks (doc_id, chunk_id, content, embedding)
       values ($1, gen_random_uuid(), $2, (${lit})::vector)`,
      [docId, text]
    )
    await query("commit")
  } catch (e) {
    await query("rollback")
    throw e
  }
}

export async function ragSearch(queryText, topK = 8) {
  const v = await embedText(queryText)
  if (!v.length) return []
  const lit = `[${v.map(x => Number(x).toFixed(6)).join(",")}]`
  const { rows } = await query(
    `select d.doc_id, d.title, c.chunk_id, c.content,
            1 - (c.embedding <=> (${lit})::vector) as score
     from rag_chunks c
     join rag_docs d using (doc_id)
     order by c.embedding <-> (${lit})::vector
     limit $1`,
    [topK]
  )
  return rows
}