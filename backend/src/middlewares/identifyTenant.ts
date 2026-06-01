import { Request, Response, NextFunction } from 'express';
import { findTenantByHeader } from '../services/tenant.service';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';

export const TENANT_HEADER = 'x-tenant-id';

/**
 * identifyTenant
 * --------------
 * Lee el header personalizado `X-Tenant-ID`, valida el tenant contra la base de
 * datos y adjunta la configuración completa del tenant a `req.tenant`. Todo lo
 * que viene después confía en `req.tenant` en lugar de cualquier valor enviado
 * por el cliente.
 */
export const identifyTenant = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const headerValue = req.header(TENANT_HEADER);

    if (!headerValue) {
      throw new AppError(400, `Missing required header: ${TENANT_HEADER}`);
    }

    const tenant = await findTenantByHeader(headerValue.trim());
    if (!tenant) {
      throw new AppError(404, 'Tenant not found');
    }

    req.tenant = tenant;
    next();
  }
);
