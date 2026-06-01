import { Request, Response, NextFunction } from 'express';
import { findTenantByHeader } from '../services/tenant.service';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';

export const TENANT_HEADER = 'x-tenant-id';

/**
 * identifyTenant
 * --------------
 * Reads the custom `X-Tenant-ID` header, validates the tenant against the DB
 * and attaches the full tenant config to `req.tenant`. Everything downstream
 * trusts `req.tenant` instead of any client-supplied value.
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
