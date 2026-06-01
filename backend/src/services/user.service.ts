import { RowDataPacket } from 'mysql2';
import { pool } from '../config/db';

export interface UserRow extends RowDataPacket {
  id: number;
  tenant_id: number;
  email: string;
  password_hash: string;
  role: 'ADMIN' | 'USER';
}

/**
 * Look up a user by email *within a given tenant*.
 * Email is unique per tenant, so the tenant scope is part of the lookup -
 * this prevents a user of tenant A from authenticating against tenant B.
 */
export async function findUserByEmailAndTenant(
  email: string,
  tenantId: number
): Promise<UserRow | null> {
  const [rows] = await pool.query<UserRow[]>(
    `SELECT id, tenant_id, email, password_hash, role
       FROM users
      WHERE email = :email AND tenant_id = :tenantId
      LIMIT 1`,
    { email, tenantId }
  );
  return rows[0] ?? null;
}
