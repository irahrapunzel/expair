import { query } from './db'
import { env } from './env'
import { embedText } from './ai'

// Create a chunk, embed, store
export async function ragIngest({ docId, title, text, tags }) {
  const embedding = await embedText(text)
  if (!embedding.length) throw new Error('Empty embedding')
  const vecLit = `[${embedding.map(v => Number(v).toFixed(6)).join(',')}]`
  const sql = `
    insert into rag_docs (doc_id, title, tags)
    values ($1, $2, $3)
    on conflict (doc_id) do update set title = excluded.title, tags = excluded.tags;
    insert into rag_chunks (doc_id, chunk_id, content, embedding)
    values ($1, gen_random_uuid(), $4, (${vecLit})::vector);
  `
  await query('begin')
  try {
    await query(sql, [docId, title, tags || null, text])
    await query('commit')
  } catch (e) {
    await query('rollback')
    throw e
  }
}

// Similarity search (cosine by default)
export async function ragSearch(queryText, topK) {
  const qvec = await embedText(queryText)
  const lit = `[${qvec.map(v => Number(v).toFixed(6)).join(',')}]`
  const sql = `
    select d.doc_id, d.title, c.chunk_id, c.content,
           1 - (c.embedding <=> (${lit})::vector) as score
    from rag_chunks c
    join rag_docs d using (doc_id)
    order by c.embedding <-> (${lit})::vector
    limit $1;
  `
  const { rows } = await query(sql, [topK || env.ragTopK])
  return rows
}