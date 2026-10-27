import type { Request, Response } from 'express';
import { z } from 'zod';

import { asyncHandler } from '../../common/async-handler.js';
import { ok } from '../../common/http.js';
import { validationError } from '../../common/errors.js';
import { listCategories, listCities, listTownships } from './catalog.service.js';

const cityIdSchema = z.string().uuid().optional();

export const listCategoriesController = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await listCategories();
  ok(res, categories);
});

export const listCitiesController = asyncHandler(async (_req: Request, res: Response) => {
  const cities = await listCities();
  ok(res, cities);
});

export const listTownshipsController = asyncHandler(async (req: Request, res: Response) => {
  const parsed = cityIdSchema.safeParse(req.query.cityId);
  if (!parsed.success) throw validationError('Invalid cityId.');
  const townships = await listTownships(parsed.data);
  ok(res, townships);
});
