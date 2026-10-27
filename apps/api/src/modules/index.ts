import { Router } from 'express';
import { healthRouter } from './health/health.routes.js';
import { authRouter } from './auth/auth.routes.js';
import { usersRouter } from './users/users.routes.js';
import { expertsRouter } from './experts/experts.routes.js';
import { catalogRouter } from './catalog/catalog.routes.js';
import { adminRouter } from './admin/admin.routes.js';
import { jobsRouter } from './jobs/jobs.routes.js';

export const apiRouter: Router = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/users', usersRouter);
apiRouter.use('/experts', expertsRouter);
apiRouter.use(catalogRouter);
apiRouter.use('/admin', adminRouter);
apiRouter.use('/jobs', jobsRouter);
