import { Router } from 'express';

import { requireAuth, requireAdmin } from '../../middleware/auth.js';
import {
  listPendingVerificationController,
  decideVerificationController,
  listUsersController,
  updateUserStatusController,
  listCategoriesAdminController,
  createCategoryController,
  updateCategoryController,
  deleteCategoryController,
  listReportsController,
  resolveReportController,
  listAuditLogsController,
  getAnalyticsController,
} from './admin.controller.js';

export const adminRouter: Router = Router();

adminRouter.get('/experts/pending-verification', requireAuth, requireAdmin, listPendingVerificationController);
adminRouter.post('/experts/:expertId/verification-decision', requireAuth, requireAdmin, decideVerificationController);

adminRouter.get('/users', requireAuth, requireAdmin, listUsersController);
adminRouter.patch('/users/:userId/status', requireAuth, requireAdmin, updateUserStatusController);

adminRouter.get('/categories', requireAuth, requireAdmin, listCategoriesAdminController);
adminRouter.post('/categories', requireAuth, requireAdmin, createCategoryController);
adminRouter.patch('/categories/:categoryId', requireAuth, requireAdmin, updateCategoryController);
adminRouter.delete('/categories/:categoryId', requireAuth, requireAdmin, deleteCategoryController);

adminRouter.get('/reports', requireAuth, requireAdmin, listReportsController);
adminRouter.post('/reports/:reportId/resolve', requireAuth, requireAdmin, resolveReportController);

adminRouter.get('/audit-logs', requireAuth, requireAdmin, listAuditLogsController);
adminRouter.get('/analytics', requireAuth, requireAdmin, getAnalyticsController);
