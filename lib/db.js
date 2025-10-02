import pg from 'pg'
import { env } from './env'

const { Pool } = pg
export const pool = new Pool({ connectionString: env.dbUrl, max: 10 })

export async function query(sql, params = []) {
  const c = await pool.connect()
  try { return await c.query(sql, params) }
  finally { c.release() }
}

// For pgvector literal: convert JS array → '[v1,v2,...]'::vector
export function asVectorParam(arr) {
  const literal = `[${arr.map(v => (Number(v)||0).toFixed(6)).join(',')}]`
  return { text: `(${literal})::vector`, value: null } // use as raw in template
}