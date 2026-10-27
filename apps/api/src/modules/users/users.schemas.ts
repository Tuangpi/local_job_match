import { z } from 'zod';

export const updateUserSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  preferredLanguage: z.enum(['my', 'en']).optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
