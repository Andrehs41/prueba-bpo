import { Request, Response } from 'express';
import { listTenants } from '../services/tenant.service';

/**
 * GET /api/v1/tenants
 * Endpoint público: lista los tenants disponibles para que la pantalla de login
 * pueda ofrecer un selector. Devuelve solo id/slug/name (sin datos sensibles).
 */
export async function getTenants(_req: Request, res: Response): Promise<void> {
  const tenants = await listTenants();
  res.json(tenants);
}
