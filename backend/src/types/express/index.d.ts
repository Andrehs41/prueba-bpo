/**
 * Augment Express' Request so middlewares can safely attach the tenant
 * context and the authenticated user across the request lifecycle.
 */
import 'express';

export interface TenantContext {
  id: number;
  slug: string;
  name: string;
}

export interface AuthUser {
  id: number;
  email: string;
  role: 'ADMIN' | 'USER';
  tenantId: number;
}

declare global {
  namespace Express {
    interface Request {
      tenant?: TenantContext;
      user?: AuthUser;
    }
  }
}
