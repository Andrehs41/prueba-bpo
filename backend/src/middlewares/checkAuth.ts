import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';
import { AuthUser } from '../types/express';

interface JwtPayload {
  sub: number;
  email: string;
  role: 'ADMIN' | 'USER';
  tenantId: number;
}

/**
 * checkAuth
 * ---------
 * Validates the JWT from the Authorization header and, crucially, verifies that
 * the token's tenant matches the tenant resolved by identifyTenant. This blocks
 * "cross-tenant" tokens: a valid token for tenant A cannot be replayed against
 * tenant B by just swapping the X-Tenant-ID header.
 *
 * Must run AFTER identifyTenant (it relies on req.tenant).
 *
 * Optionally enforces a role: checkAuth('ADMIN').
 */
export function checkAuth(...allowedRoles: Array<'ADMIN' | 'USER'>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.tenant) {
      throw new AppError(500, 'checkAuth must run after identifyTenant');
    }

    const header = req.header('authorization');
    if (!header?.startsWith('Bearer ')) {
      throw new AppError(401, 'Missing or malformed Authorization header');
    }

    const token = header.slice('Bearer '.length).trim();

    let payload: JwtPayload;
    try {
      payload = jwt.verify(token, env.jwt.secret) as unknown as JwtPayload;
    } catch {
      throw new AppError(401, 'Invalid or expired token');
    }

    // The user must legally belong to the tenant in the request.
    if (payload.tenantId !== req.tenant.id) {
      throw new AppError(403, 'Token does not belong to the requested tenant');
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(payload.role)) {
      throw new AppError(403, 'Insufficient role for this resource');
    }

    const user: AuthUser = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      tenantId: payload.tenantId,
    };
    req.user = user;
    next();
  };
}
