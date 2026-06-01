import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Envuelve una ruta/middleware asíncrono para que las promesas rechazadas se
 * reenvíen al pipeline de errores de Express en lugar de tumbar el proceso
 * (DRY: sin try/catch repetido en cada controlador).
 */
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    fn(req, res, next).catch(next);
  };
