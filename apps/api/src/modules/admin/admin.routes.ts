import { Router } from 'express';

import { requireAuth, requireAdmin } from '../../middleware/auth.js';
import {
  listPendingVerificationController,
  decideVerificationController,
} from './admin.controller.js';

export const adminRouter: Router = Router();

adminRouter.get('/experts/pending-verification', requireAuth, requireAdmin, listPendingVerificationController);
adminRouter.post('/experts/:expertId/verification-decision', requireAuth, requireAdmin, decideVerificationController);