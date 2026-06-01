/**
 * Extiende el Request de Express para que los middlewares puedan adjuntar de
 * forma segura el contexto del tenant y el usuario autenticado durante todo el
 * ciclo de vida del request.
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
