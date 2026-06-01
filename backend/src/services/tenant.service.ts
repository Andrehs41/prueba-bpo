import { RowDataPacket } from 'mysql2';
import { pool } from '../config/db';
import { TenantContext } from '../types/express';

interface TenantRow extends RowDataPacket {
  id: number;
  slug: string;
  name: string;
}

/**
 * Lista pública de tenants (id, slug, name) para el selector del login.
 * No expone datos sensibles; ordenada alfabéticamente por nombre.
 */
export async function listTenants(): Promise<TenantContext[]> {
  const [rows] = await pool.query<TenantRow[]>(
    `SELECT id, slug, name FROM tenants ORDER BY name ASC`
  );
  return rows.map((t) => ({ id: t.id, slug: t.slug, name: t.name }));
}

/**
 * Resuelve un tenant a partir del valor que viene en el header X-Tenant-ID.
 * El header puede traer el id numérico o el slug, así que aceptamos ambos.
 * Devuelve null cuando ningún tenant coincide (quien llama decide la respuesta HTTP).
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
