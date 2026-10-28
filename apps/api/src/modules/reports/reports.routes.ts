import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { createReportController } from '../bookings/bookings.controller.js';

export const reportsRouter: Router = Router();
reportsRouter.post('/', requireAuth, createReportController);