import { Router } from 'express';
import { healthRouter } from './health/health.routes.js';
import { authRouter } from './auth/auth.routes.js';
import { usersRouter } from './users/users.routes.js';

export const apiRouter: Router = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/users', usersRouter);
