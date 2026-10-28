import { z } from 'zod';

export const bookingIdParamSchema = z.object({
  bookingId: z.string().uuid(),
});

export const transitionStatusSchema = z.object({
  status: z.enum(['in_progress', 'completed', 'cancelled', 'disputed']),
  note: z.string().trim().max(2000).optional(),
});

export const cancelBookingSchema = z.object({
  note: z.string().trim().max(2000).optional(),
});

export const createReviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().max(5000).optional(),
});

export const createReportSchema = z.object({
  bookingId: z.string().uuid().optional(),
  reason: z.string().trim().min(1).max(120),
  description: z.string().trim().max(5000).optional(),
});

export type TransitionStatusInput = z.infer<typeof transitionStatusSchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type CreateReportInput = z.infer<typeof createReportSchema>;