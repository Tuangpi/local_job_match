import type { Request, Response } from 'express';
import { z } from 'zod';

import { asyncHandler } from '../../common/async-handler.js';
import { ok } from '../../common/http.js';
import { unauthenticated } from '../../common/errors.js';
import {
  getBooking,
  transitionBookingStatus,
  cancelBooking,
  createReview,
  createReport,
  createReportFromInput,
  listReports,
  resolveReport,
} from './bookings.service.js';
import {
  bookingIdParamSchema,
  transitionStatusSchema,
  cancelBookingSchema,
  createReviewSchema,
  createReportSchema,
} from './bookings.schemas.js';

function userId(req: Request): string {
  if (!req.user) throw unauthenticated();
  return req.user.id;
}

export const getBookingController = asyncHandler(async (req: Request, res: Response) => {
  const { bookingId } = bookingIdParamSchema.parse(req.params);
  const result = await getBooking(bookingId, userId(req));
  ok(res, result);
});

export const transitionBookingStatusController = asyncHandler(async (req: Request, res: Response) => {
  const { bookingId } = bookingIdParamSchema.parse(req.params);
  const input = transitionStatusSchema.parse(req.body ?? {});
  const result = await transitionBookingStatus(userId(req), bookingId, input.status, input.note);
  ok(res, result);
});

export const cancelBookingController = asyncHandler(async (req: Request, res: Response) => {
  const { bookingId } = bookingIdParamSchema.parse(req.params);
  const input = cancelBookingSchema.parse(req.body ?? {});
  const result = await cancelBooking(userId(req), bookingId, input.note);
  ok(res, result);
});

export const createReviewController = asyncHandler(async (req: Request, res: Response) => {
  const { bookingId } = bookingIdParamSchema.parse(req.params);
  const input = createReviewSchema.parse(req.body ?? {});
  const result = await createReview(userId(req), bookingId, input.rating, input.comment);
  ok(res, result, 201);
});

export const createReportByBookingController = asyncHandler(async (req: Request, res: Response) => {
  const { bookingId } = bookingIdParamSchema.parse(req.params);
  const input = createReportSchema.parse(req.body ?? {});
  const result = await createReport(userId(req), bookingId, input.reason, input.description);
  ok(res, result, 201);
});

export const createReportController = asyncHandler(async (req: Request, res: Response) => {
  const input = createReportSchema.parse(req.body ?? {});
  const result = await createReportFromInput(userId(req), input as any);
  ok(res, result, 201);
});

export const listReportsController = asyncHandler(async (req: Request, res: Response) => {
  const status = typeof req.query.status === 'string' ? req.query.status : undefined;
  const result = await listReports(status);
  ok(res, { items: result });
});

export const resolveReportController = asyncHandler(async (req: Request, res: Response) => {
  const { reportId } = z.object({ reportId: z.string().uuid() }).parse(req.params);
  const body = z.object({ resolution: z.string().trim().min(1), status: z.string().optional() }).parse(req.body ?? {});
  const result = await resolveReport(userId(req), reportId, body.resolution, body.status);
  ok(res, result);
});