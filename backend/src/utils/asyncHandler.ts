import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Wraps an async route/middleware so rejected promises are forwarded to
 * Express' error pipeline instead of crashing the process (DRY: no repeated
 * try/catch in every controller).
 */
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    fn(req, res, next).catch(next);
  };
