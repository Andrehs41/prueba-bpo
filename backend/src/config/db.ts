import mysql from 'mysql2/promise';
import { env } from './env';

/**
 * Shared MySQL connection pool.
 * A single pool is reused across the app (DRY): controllers/services never
 * open their own connections, they borrow from here.
 */
export const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  namedPlaceholders: true,
});

/** Quick connectivity check used at server boot. */
export async function assertDbConnection(): Promise<void> {
  const conn = await pool.getConnection();
  try {
    await conn.ping();
  } finally {
    conn.release();
  }
}
