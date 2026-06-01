import { Request, Response } from 'express';
import { AppError } from '../utils/AppError';
import { listRecordsByTenant, createRecordForTenant } from '../services/records.service';

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

/** GET /api/v1/records?limit=&offset= - only the current tenant's records. */
export async function getRecords(req: Request, res: Response): Promise<void> {
  const tenant = req.tenant!; // guaranteed by identifyTenant

  // Sanitize pagination input (clamp + safe defaults).
  const limit = Math.min(
    Math.max(parseInt(String(req.query.limit ?? DEFAULT_LIMIT), 10) || DEFAULT_LIMIT, 1),
    MAX_LIMIT
  );
  const offset = Math.max(parseInt(String(req.query.offset ?? 0), 10) || 0, 0);

  const result = await listRecordsByTenant(tenant.id, limit, offset);
  res.json(result);
}

/** POST /api/v1/records - inserts a record auto-bound to the current tenant. */
export async function postRecord(req: Request, res: Response): Promise<void> {
  const tenant = req.tenant!;
  const { name, amount } = req.body ?? {};

  if (typeof name !== 'string' || name.trim().length === 0) {
    throw new AppError(400, 'name is required');
  }
  const numericAmount = Number(amount ?? 0);
  if (Number.isNaN(numericAmount) || numericAmount < 0) {
    throw new AppError(400, 'amount must be a non-negative number');
  }

  // tenant.id comes from the server context, never from the request body.
  const record = await createRecordForTenant(tenant.id, name.trim(), numericAmount);
  res.status(201).json(record);
}
