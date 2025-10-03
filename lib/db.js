import pg from "pg"
import { env } from "./env.js"

let pool
export function db() {
  if (!pool) {
    pool = new pg.Pool({
      connectionString: env.dbUrl,
      ssl: /localhost|127\.0\.0\.1/i.test(env.dbUrl) ? false : { rejectUnauthorized: false },
      max: 10,
    })
  }
  return pool
}
export async function query(sql, params = []) {
  const c = await db().connect()
  try { return await c.query(sql, params) } finally { c.release() }
}
export function hasDB() { return !!env.dbUrl }