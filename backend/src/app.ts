import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import apiRoutes from './routes';
import { notFound, errorHandler } from './middlewares/errorHandler';

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.corsOrigin,
      // Permite el header personalizado del tenant desde el navegador.
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID'],
    })
  );
  app.use(express.json());

  // Todos los endpoints de negocio viven bajo /api/v1.
  app.use('/api/v1', apiRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
