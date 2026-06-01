import mysql from 'mysql2/promise';
import { env } from './env';

/**
 * Pool de conexiones MySQL compartido.
 * Un único pool se reutiliza en toda la app (DRY): los controladores/servicios
 * nunca abren sus propias conexiones, las toman prestadas de aquí.
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
  charset: 'utf8mb4',
});

/** Comprobación rápida de conectividad usada al arrancar el servidor. */
export async function assertDbConnection(): Promise<void> {
  const conn = await pool.getConnection();
  try {
    await conn.ping();
  } finally {
    conn.release();
  }
}
