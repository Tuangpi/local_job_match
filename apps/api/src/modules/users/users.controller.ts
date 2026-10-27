import type { Request, Response } from 'express';

import { asyncHandler } from '../../common/async-handler.js';
import { ok } from '../../common/http.js';
import { unauthenticated } from '../../common/errors.js';
import { getCurrentUser, updateCurrentUser } from './users.service.js';
import { updateUserSchema } from './users.schemas.js';

export const meController = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw unauthenticated();
  const user = await getCurrentUser(req.user.id);
  ok(res, user);
});

export const updateMeController = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw unauthenticated();
  const input = updateUserSchema.parse(req.body);
  const user = await updateCurrentUser(req.user.id, input);
  ok(res, user);
});
