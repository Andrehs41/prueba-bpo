import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { pool } from '../config/db';

export interface RecordRow extends RowDataPacket {
  id: number;
  tenant_id: number;
  tenant_seq: number; // visible, per-tenant sequential number
  name: string;
  amount: string; // DECIMAL is returned as string by mysql2
  created_at: Date;
}

export interface Paginated<T> {
  data: T[];
  pagination: { total: number; limit: number; offset: number };
}

/**
 * List records for ONE tenant with limit/offset pagination.
 * tenant_id is always applied server-side - the caller cannot widen the scope.
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
 * Insert a record bound to the given tenant, assigning the next per-tenant
 * sequential number atomically.
 *
 * Runs inside a transaction: the counter row is incremented with
 * INSERT ... ON DUPLICATE KEY UPDATE (which takes a row lock), so concurrent
 * inserts for the same tenant can never get the same tenant_seq.
 * tenant_id is injected from the server-side context, never from the body.
 */
export async function createRecordForTenant(
  tenantId: number,
  name: string,
  amount: number
): Promise<RecordRow> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Atomically bump and read this tenant's counter.
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
