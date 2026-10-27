import { z } from 'zod';

export const createExpertProfileSchema = z.object({
  bio: z.string().trim().max(2000).optional(),
  experienceYears: z.number().int().min(0).max(80).optional(),
  isAvailable: z.boolean().optional(),
});

export const updateExpertProfileSchema = createExpertProfileSchema.partial();

export const replaceSkillsSchema = z.object({
  skills: z
    .array(
      z.object({
        categoryId: z.string().uuid(),
        experienceYears: z.number().int().min(0).max(80).optional(),
      }),
    )
    .max(50),
});

export const replaceAreasSchema = z.object({
  townshipIds: z.array(z.string().uuid()).max(100),
});

export const replacePortfolioSchema = z.object({
  items: z
    .array(
      z.object({
        storageKey: z.string().trim().min(1).max(500),
        caption: z.string().trim().max(500).optional(),
      }),
    )
    .max(30),
});

export type CreateExpertProfileInput = z.infer<typeof createExpertProfileSchema>;
export type UpdateExpertProfileInput = z.infer<typeof updateExpertProfileSchema>;
export type ReplaceSkillsInput = z.infer<typeof replaceSkillsSchema>;
export type ReplaceAreasInput = z.infer<typeof replaceAreasSchema>;
export type ReplacePortfolioInput = z.infer<typeof replacePortfolioSchema>;
