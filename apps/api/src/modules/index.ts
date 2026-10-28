import { Router } from 'express';
import { healthRouter } from './health/health.routes.js';
import { authRouter } from './auth/auth.routes.js';
import { usersRouter } from './users/users.routes.js';
import { expertsRouter } from './experts/experts.routes.js';
import { catalogRouter } from './catalog/catalog.routes.js';
import { adminRouter } from './admin/admin.routes.js';
import { jobsRouter } from './jobs/jobs.routes.js';
import { quotationsRouter } from './quotations/quotations.routes.js';
import { bookingsRouter } from './bookings/bookings.routes.js';
import { reportsRouter } from './reports/reports.routes.js';

export const apiRouter: Router = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/users', usersRouter);
apiRouter.use('/experts', expertsRouter);
apiRouter.use(catalogRouter);
apiRouter.use('/admin', adminRouter);
apiRouter.use('/jobs', jobsRouter);
apiRouter.use('/quotations', quotationsRouter);
apiRouter.use('/bookings', bookingsRouter);
apiRouter.use('/reports', reportsRouter);
