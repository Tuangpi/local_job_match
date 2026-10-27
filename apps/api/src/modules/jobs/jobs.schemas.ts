import { z } from 'zod';

export const JOB_TYPES = ['one_day', 'installation', 'project'] as const;

export const createJobSchema = z.object({
  categoryId: z.string().uuid(),
  townshipId: z.string().uuid(),
  jobType: z.enum(JOB_TYPES),
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().min(1).max(5000),
  budgetMin: z.coerce.number().int().min(0).optional(),
  budgetMax: z.coerce.number().int().min(0).optional(),
  currency: z.string().trim().length(3).default('MMK'),
  preferredDate: z.string().trim().optional(),
});

export const updateJobSchema = z.object({
  categoryId: z.string().uuid().optional(),
  townshipId: z.string().uuid().optional(),
  jobType: z.enum(JOB_TYPES).optional(),
  title: z.string().trim().min(1).max(160).optional(),
  description: z.string().trim().min(1).max(5000).optional(),
  budgetMin: z.coerce.number().int().min(0).nullable().optional(),
  budgetMax: z.coerce.number().int().min(0).nullable().optional(),
  currency: z.string().trim().length(3).optional(),
  preferredDate: z.string().trim().nullable().optional(),
  status: z.enum(['draft', 'open']).optional(),
});

export const jobIdParamSchema = z.object({
  jobId: z.string().uuid(),
});

export const inviteExpertsSchema = z.object({
  expertId: z.string().uuid().optional(),
  expertIds: z.array(z.string().uuid()).max(50).optional(),
}).refine((v) => v.expertId || (v.expertIds && v.expertIds.length > 0), {
  message: 'expertId or expertIds is required.',
});

export type InviteExpertsInput = z.infer<typeof inviteExpertsSchema>;

export const quotationSchema = z.object({
  jobId: z.string().uuid().optional(),
  laborAmount: z.coerce.number().int().min(0),
  materialsAmount: z.coerce.number().int().min(0).default(0),
  currency: z.string().trim().length(3).default('MMK'),
  scope: z.string().trim().min(1).max(5000),
  estimatedDays: z.coerce.number().int().min(1).max(365).optional(),
  validUntil: z.string().trim().optional(),
});

export type CreateJobInput = z.infer<typeof createJobSchema>;
export type QuotationInput = z.infer<typeof quotationSchema>;
export type UpdateJobInput = z.infer<typeof updateJobSchema>;
