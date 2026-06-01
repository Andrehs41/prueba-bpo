import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { pool } from '../config/db';

export interface RecordRow extends RowDataPacket {
  id: number;
  tenant_id: number;
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
    `SELECT id, tenant_id, name, amount, created_at
       FROM records
      WHERE tenant_id = :tenantId
      ORDER BY id DESC
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
 * Insert a record bound to the given tenant.
 * tenant_id is injected from the server-side context, never from the body.
 */
export async function createRecordForTenant(
  tenantId: number,
  name: string,
  amount: number
): Promise<RecordRow> {
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO records (tenant_id, name, amount) VALUES (:tenantId, :name, :amount)`,
    { tenantId, name, amount }
  );

  const [rows] = await pool.query<RecordRow[]>(
    `SELECT id, tenant_id, name, amount, created_at FROM records WHERE id = :id`,
    { id: result.insertId }
  );
  return rows[0];
}
