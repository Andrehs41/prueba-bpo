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
 * Valida el JWT del header Authorization y, lo más importante, verifica que el
 * tenant del token coincida con el tenant resuelto por identifyTenant. Esto
 * bloquea los tokens "cross-tenant": un token válido para el tenant A no puede
 * reutilizarse contra el tenant B con solo cambiar el header X-Tenant-ID.
 *
 * Debe ejecutarse DESPUÉS de identifyTenant (depende de req.tenant).
 *
 * Opcionalmente exige un rol: checkAuth('ADMIN').
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

    // El usuario debe pertenecer legítimamente al tenant del request.
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
