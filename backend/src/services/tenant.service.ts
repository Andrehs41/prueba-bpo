import { RowDataPacket } from 'mysql2';
import { pool } from '../config/db';
import { TenantContext } from '../types/express';

interface TenantRow extends RowDataPacket {
  id: number;
  slug: string;
  name: string;
}

/**
 * Resolve a tenant by the value coming from the X-Tenant-ID header.
 * The header may carry either the numeric id or the slug, so we accept both.
 * Returns null when no tenant matches (caller decides the HTTP response).
 */
export async function findTenantByHeader(rawValue: string): Promise<TenantContext | null> {
  const asNumber = Number(rawValue);
  const isNumericId = Number.isInteger(asNumber) && asNumber > 0;

  const [rows] = await pool.query<TenantRow[]>(
    `SELECT id, slug, name FROM tenants WHERE ${isNumericId ? 'id = :value' : 'slug = :value'} LIMIT 1`,
    { value: isNumericId ? asNumber : rawValue }
  );

  const tenant = rows[0];
  return tenant ? { id: tenant.id, slug: tenant.slug, name: tenant.name } : null;
}
