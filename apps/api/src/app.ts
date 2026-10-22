import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './common/error-handler.js';
import { requestId, requestLogger } from './middleware/request-id.js';
import { apiRouter } from './modules/index.js';

export const API_PREFIX = '/api/v1';

export function createApp(): Express {
  const app = express();

  app.disable('x-powered-by');

  app.use(helmet());
  app.use(
    cors({
      origin: env.webOrigin,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false, limit: '1mb' }));

  app.use(requestId);
  app.use(requestLogger);

  app.get('/', (_req, res) => {
    res.json({
      data: {
        service: 'ljm-api',
        apiPrefix: API_PREFIX,
        documentation: 'docs/API.md',
      },
    });
  });

  app.use(API_PREFIX, apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
