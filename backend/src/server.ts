import { createApp } from './app';
import { env } from './config/env';
import { assertDbConnection } from './config/db';

async function bootstrap() {
  try {
    await assertDbConnection();
    // eslint-disable-next-line no-console
    console.log('[db] connected');
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[db] connection failed:', err);
    process.exit(1);
  }

  const app = createApp();
  app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`[server] listening on http://localhost:${env.port}`);
  });
}

bootstrap();
