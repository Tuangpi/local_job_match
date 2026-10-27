import { z } from 'zod';

export const verificationDecisionSchema = z.object({}).passthrough();

export type VerificationDecisionInput = z.infer<typeof verificationDecisionSchema>;

export const expertIdParamSchema = z.object({
  expertId: z.string().uuid(),
});

export type ExpertIdParam = z.infer<typeof expertIdParamSchema>;