import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

/** Manejador 404 para rutas no coincidentes. */
export function notFound(_req: Request, res: Response): void {
  res.status(404).json({ error: 'Route not found' });
}

/**
 * Manejador de errores central. Traduce AppError (y cualquier cosa inesperada)
 * a una forma JSON consistente para que los controladores nunca formateen las
 * respuestas de error por sí mismos.
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
