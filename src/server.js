import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import app from './app.js';

const port = process.env.PORT ?? 3000;

const server = serve({
  fetch: app.fetch,
  port: process.env.PORT ?? 3000,
});

server.on('listening', () => {
  console.info(`🌐 server is listening on port ${port}`);
});

app.use('/*', serveStatic({ root: './web/public' }));

/**
 * Graceful shutdown.
 */
function shutdown() {
  console.info('🛑 server is shutting down');

  server.close((error) => {
    if (error) {
      console.error(error);
      process.exit(1);
    }
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
