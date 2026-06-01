import { Request, Response } from 'express';
import { listTenants } from '../services/tenant.service';

/**
 * GET /api/v1/tenants
 * Public endpoint: lists the available tenants so the login screen can offer a
 * selector. Returns only id/slug/name (no sensitive data).
 */
export async function getTenants(_req: Request, res: Response): Promise<void> {
  const tenants = await listTenants();
  res.json(tenants);
}
