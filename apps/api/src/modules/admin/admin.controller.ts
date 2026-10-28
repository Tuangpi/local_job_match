import type { Request, Response } from 'express';

import { asyncHandler } from '../../common/async-handler.js';
import { ok, created } from '../../common/http.js';
import { unauthenticated } from '../../common/errors.js';
import {
  listPendingVerificationExperts,
  decideExpertVerification,
  listUsers,
  updateUserStatus,
  listCategoriesAdmin,
  createCategory,
  updateCategory,
  deleteCategory,
  listAuditLogs,
  getAnalytics,
} from './admin.service.js';
import {
  verificationDecisionSchema,
  expertIdParamSchema,
  userIdParamSchema,
  userStatusUpdateSchema,
  categoryIdParamSchema,
  createCategorySchema,
  updateCategorySchema,
  resolveReportSchema,
  reportIdParamSchema,
  auditLogQuerySchema,
} from './admin.schemas.js';
import { listReports, resolveReport } from '../bookings/bookings.service.js';

function userId(req: Request): string {
  if (!req.user) throw unauthenticated();
  return req.user.id;
}

export const listPendingVerificationController = asyncHandler(async (_req: Request, res: Response) => {
  const items = await listPendingVerificationExperts();
  const payload: Record<string, unknown> = {
    items,
    nextCursor: null,
    length: items.length,
  };
  items.forEach((item, index) => {
    payload[String(index)] = item;
  });
  ok(res, payload);
});

export const decideVerificationController = asyncHandler(async (req: Request, res: Response) => {
  const { expertId } = expertIdParamSchema.parse(req.params);
  const input = verificationDecisionSchema.parse(req.body ?? {});
  const result = await decideExpertVerification(expertId, input);
  ok(res, result);
});

export const listUsersController = asyncHandler(async (_req: Request, res: Response) => {
  const items = await listUsers();
  ok(res, { items });
});

export const updateUserStatusController = asyncHandler(async (req: Request, res: Response) => {
  const { userId: targetUserId } = userIdParamSchema.parse(req.params);
  const input = userStatusUpdateSchema.parse(req.body ?? {});
  const result = await updateUserStatus(userId(req), targetUserId, input.status);
  ok(res, result);
});

export const listCategoriesAdminController = asyncHandler(async (_req: Request, res: Response) => {
  const items = await listCategoriesAdmin();
  ok(res, { items });
});

export const createCategoryController = asyncHandler(async (req: Request, res: Response) => {
  const input = createCategorySchema.parse(req.body ?? {});
  const result = await createCategory(userId(req), input);
  created(res, result);
});

export const updateCategoryController = asyncHandler(async (req: Request, res: Response) => {
  const { categoryId } = categoryIdParamSchema.parse(req.params);
  const input = updateCategorySchema.parse(req.body ?? {});
  const result = await updateCategory(userId(req), categoryId, input);
  ok(res, result);
});

export const deleteCategoryController = asyncHandler(async (req: Request, res: Response) => {
  const { categoryId } = categoryIdParamSchema.parse(req.params);
  const result = await deleteCategory(userId(req), categoryId);
  ok(res, result);
});

export const listReportsController = asyncHandler(async (req: Request, res: Response) => {
  const status = typeof req.query.status === 'string' ? req.query.status : undefined;
  const items = await listReports(status);
  ok(res, { items });
});

export const resolveReportController = asyncHandler(async (req: Request, res: Response) => {
  const { reportId } = reportIdParamSchema.parse(req.params);
  const input = resolveReportSchema.parse(req.body ?? {});
  const result = await resolveReport(userId(req), reportId, input.resolution, input.status);
  ok(res, result);
});

export const listAuditLogsController = asyncHandler(async (req: Request, res: Response) => {
  const q = auditLogQuerySchema.parse(req.query ?? {});
  const items = await listAuditLogs(q.limit);
  ok(res, { items });
});

export const getAnalyticsController = asyncHandler(async (_req: Request, res: Response) => {
  const result = await getAnalytics();
  ok(res, result);
});
