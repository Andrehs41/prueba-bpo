import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { pool } from '../config/db';

export interface RecordRow extends RowDataPacket {
  id: number;
  tenant_id: number;
  tenant_seq: number; // número secuencial visible, por tenant
  name: string;
  amount: string; // mysql2 devuelve DECIMAL como string
  created_at: Date;
}

export interface Paginated<T> {
  data: T[];
  pagination: { total: number; limit: number; offset: number };
}

/**
 * Lista los registros de UN solo tenant con paginación limit/offset.
 * tenant_id siempre se aplica del lado del servidor; quien llama no puede
 * ampliar el alcance.
 */
export async function listRecordsByTenant(
  tenantId: number,
  limit: number,
  offset: number
): Promise<Paginated<RecordRow>> {
  const [rows] = await pool.query<RecordRow[]>(
    `SELECT id, tenant_id, tenant_seq, name, amount, created_at
       FROM records
      WHERE tenant_id = :tenantId
      ORDER BY tenant_seq DESC
      LIMIT :limit OFFSET :offset`,
    { tenantId, limit, offset }
  );

  const [countRows] = await pool.query<(RowDataPacket & { total: number })[]>(
    `SELECT COUNT(*) AS total FROM records WHERE tenant_id = :tenantId`,
    { tenantId }
  );

  return {
    data: rows,
    pagination: { total: countRows[0]?.total ?? 0, limit, offset },
  };
}

/**
 * Inserta un registro asociado al tenant dado, asignando de forma atómica el
 * siguiente número secuencial por tenant.
 *
 * Se ejecuta dentro de una transacción: la fila del contador se incrementa con
 * INSERT ... ON DUPLICATE KEY UPDATE (que toma un bloqueo de fila), por lo que
 * inserciones concurrentes para el mismo tenant nunca pueden obtener el mismo
 * tenant_seq.
 * tenant_id se inyecta desde el contexto del servidor, nunca desde el body.
 */
export async function createRecordForTenant(
  tenantId: number,
  name: string,
  amount: number
): Promise<RecordRow> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Incrementa y lee de forma atómica el contador de este tenant.
    await conn.query(
      `INSERT INTO tenant_record_seq (tenant_id, last_seq)
            VALUES (:tenantId, 1)
       ON DUPLICATE KEY UPDATE last_seq = last_seq + 1`,
      { tenantId }
    );
    const [seqRows] = await conn.query<(RowDataPacket & { last_seq: number })[]>(
      `SELECT last_seq FROM tenant_record_seq WHERE tenant_id = :tenantId`,
      { tenantId }
    );
    const nextSeq = seqRows[0].last_seq;

    const [result] = await conn.query<ResultSetHeader>(
      `INSERT INTO records (tenant_id, tenant_seq, name, amount)
            VALUES (:tenantId, :nextSeq, :name, :amount)`,
      { tenantId, nextSeq, name, amount }
    );

    const [rows] = await conn.query<RecordRow[]>(
      `SELECT id, tenant_id, tenant_seq, name, amount, created_at
         FROM records WHERE id = :id`,
      { id: result.insertId }
    );

    await conn.commit();
    return rows[0];
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}
