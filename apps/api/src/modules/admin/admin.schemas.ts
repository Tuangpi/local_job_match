import { z } from 'zod';

export const verificationDecisionSchema = z.object({}).passthrough();

export type VerificationDecisionInput = z.infer<typeof verificationDecisionSchema>;

export const expertIdParamSchema = z.object({
  expertId: z.string().uuid(),
});

export type ExpertIdParam = z.infer<typeof expertIdParamSchema>;

export const userIdParamSchema = z.object({
  userId: z.string().uuid(),
});

export const userStatusUpdateSchema = z.object({
  status: z.enum(['active', 'suspended', 'pending', 'deleted']),
});

export const categoryIdParamSchema = z.object({
  categoryId: z.string().uuid(),
});

export const createCategorySchema = z.object({
  parentId: z.string().uuid().nullable().optional(),
  slug: z.string().trim().min(1).max(100),
  nameEn: z.string().trim().min(1).max(120),
  nameMy: z.string().trim().max(120).optional(),
  isActive: z.boolean().optional(),
});

export const updateCategorySchema = z.object({
  parentId: z.string().uuid().nullable().optional(),
  slug: z.string().trim().min(1).max(100).optional(),
  nameEn: z.string().trim().min(1).max(120).optional(),
  nameMy: z.string().trim().max(120).nullable().optional(),
  isActive: z.boolean().optional(),
});

export const reportIdParamSchema = z.object({
  reportId: z.string().uuid(),
});

export const resolveReportSchema = z.object({
  resolution: z.string().trim().min(1).max(5000),
  status: z.string().trim().optional(),
});

export const auditLogQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
});
