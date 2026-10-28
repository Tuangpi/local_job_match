import type { Request, Response } from 'express';

import { asyncHandler } from '../../common/async-handler.js';
import { ok, created } from '../../common/http.js';
import { unauthenticated } from '../../common/errors.js';
import {
  createExpertProfile,
  getExpertProfile,
  updateExpertProfile,
  replaceSkills,
  replaceAreas,
  replacePortfolio,
  searchExperts,
  getPublicExpertProfile,
  getExpertReviews,
} from './experts.service.js';
import {
  createExpertProfileSchema,
  updateExpertProfileSchema,
  replaceSkillsSchema,
  replaceAreasSchema,
  replacePortfolioSchema,
  expertsSearchQuerySchema,
  expertIdParamSchema,
} from './experts.schemas.js';

function userId(req: Request): string {
  if (!req.user) throw unauthenticated();
  return req.user.id;
}

export const createProfileController = asyncHandler(async (req: Request, res: Response) => {
  const input = createExpertProfileSchema.parse(req.body ?? {});
  const profile = await createExpertProfile(userId(req), input);
  created(res, profile);
});

export const getProfileController = asyncHandler(async (req: Request, res: Response) => {
  const profile = await getExpertProfile(userId(req));
  ok(res, profile);
});

export const updateProfileController = asyncHandler(async (req: Request, res: Response) => {
  const input = updateExpertProfileSchema.parse(req.body ?? {});
  const profile = await updateExpertProfile(userId(req), input);
  ok(res, profile);
});

export const replaceSkillsController = asyncHandler(async (req: Request, res: Response) => {
  const input = replaceSkillsSchema.parse(req.body);
  const profile = await replaceSkills(userId(req), input);
  ok(res, profile);
});

export const replaceAreasController = asyncHandler(async (req: Request, res: Response) => {
  const input = replaceAreasSchema.parse(req.body);
  const profile = await replaceAreas(userId(req), input);
  ok(res, profile);
});

export const replacePortfolioController = asyncHandler(async (req: Request, res: Response) => {
  const input = replacePortfolioSchema.parse(req.body);
  const profile = await replacePortfolio(userId(req), input);
  ok(res, profile);
});

export const searchExpertsController = asyncHandler(async (req: Request, res: Response) => {
  const query = expertsSearchQuerySchema.parse(req.query);
  const result = await searchExperts(query);
  ok(res, result);
});

export const getExpertReviewsController = asyncHandler(async (req: Request, res: Response) => {
  const { expertId } = expertIdParamSchema.parse(req.params);
  const result = await getExpertReviews(expertId);
  ok(res, { items: result });
});

export const getPublicProfileController = asyncHandler(async (req: Request, res: Response) => {
  const { expertId } = expertIdParamSchema.parse(req.params);
  const profile = await getPublicExpertProfile(expertId);
  ok(res, profile);
});
