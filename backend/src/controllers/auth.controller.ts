import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';
import { findUserByEmailAndTenant } from '../services/user.service';

/**
 * POST /api/v1/auth/login
 * Authenticates a user *within the tenant from X-Tenant-ID* and issues a JWT
 * that embeds the tenant id + role. Runs after identifyTenant.
 */
export async function login(req: Request, res: Response): Promise<void> {
  const tenant = req.tenant!; // guaranteed by identifyTenant
  const { email, password } = req.body ?? {};

  if (typeof email !== 'string' || typeof password !== 'string') {
    throw new AppError(400, 'email and password are required');
  }

  const user = await findUserByEmailAndTenant(email, tenant.id);
  // Same generic message whether the user is missing or the password is wrong.
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    throw new AppError(401, 'Invalid credentials');
  }

  const token = jwt.sign(
    { sub: user.id, email: user.email, role: user.role, tenantId: user.tenant_id },
    env.jwt.secret,
    { expiresIn: env.jwt.expiresIn } as SignOptions
  );

  res.json({
    token,
    user: { id: user.id, email: user.email, role: user.role },
    tenant: { id: tenant.id, slug: tenant.slug, name: tenant.name },
  });
}
