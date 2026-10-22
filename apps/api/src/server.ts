import { createServer } from 'node:http';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './common/logger.js';

const app = createApp();
const server = createServer(app);

server.listen(env.apiPort, () => {
  logger.info('api listening', {
    port: env.apiPort,
    environment: env.nodeEnv,
    webOrigin: env.webOrigin,
  });
});

function shutdown(signal: string): void {
  logger.info('shutting down api', { signal });
  server.close((error) => {
    if (error) {
      logger.error('error during shutdown', { errorMessage: error.message });
      process.exit(1);
    }
    process.exit(0);
  });

  // Force exit if connections stay open too long.
  setTimeout(() => {
    logger.warn('forcing shutdown after timeout');
    process.exit(1);
  }, 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
