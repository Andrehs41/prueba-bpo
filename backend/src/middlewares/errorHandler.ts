import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

/** 404 handler for unmatched routes. */
export function notFound(_req: Request, res: Response): void {
  res.status(404).json({ error: 'Route not found' });
}

/**
 * Central error handler. Translates AppError (and anything unexpected) into a
 * consistent JSON shape so controllers never format error responses themselves.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  // eslint-disable-next-line no-console
  console.error('[unhandled error]', err);
  res.status(500).json({ error: 'Internal server error' });
}
