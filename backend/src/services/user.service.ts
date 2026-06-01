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
 * Busca un usuario por correo *dentro de un tenant dado*.
 * El correo es único por tenant, así que el alcance del tenant forma parte de
 * la búsqueda; esto evita que un usuario del tenant A se autentique contra el
 * tenant B.
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
