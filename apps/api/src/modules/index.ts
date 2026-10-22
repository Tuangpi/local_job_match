import { Router } from 'express';
import { healthRouter } from './health/health.routes.js';

/**
 * Compose the API router. Business modules are registered here as they are
 * implemented (auth, users, catalog, jobs, quotations, bookings, ...).
 */
export const apiRouter: Router = Router();

apiRouter.use('/health', healthRouter);
