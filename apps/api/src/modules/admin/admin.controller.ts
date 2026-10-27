import type { Request, Response } from 'express';

import { asyncHandler } from '../../common/async-handler.js';
import { ok } from '../../common/http.js';
import { unauthenticated } from '../../common/errors.js';
import {
  listPendingVerificationExperts,
  decideExpertVerification,
} from './admin.service.js';
import {
  verificationDecisionSchema,
  expertIdParamSchema,
} from './admin.schemas.js';

export const listPendingVerificationController = asyncHandler(async (_req: Request, res: Response) => {
  const items = await listPendingVerificationExperts();
  const payload: Record<string, unknown> = {
    items,
    nextCursor: null,
    length: items.length,
  };
  items.forEach((item, index) => {
    payload[String(index)] = item;
  });
  ok(res, payload);
});

export const decideVerificationController = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw unauthenticated();
  const { expertId } = expertIdParamSchema.parse(req.params);
  const input = verificationDecisionSchema.parse(req.body ?? {});
  const result = await decideExpertVerification(expertId, input);
  ok(res, result);
});