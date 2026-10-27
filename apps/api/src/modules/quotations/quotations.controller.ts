import type { Request, Response } from 'express';
import { z } from 'zod';

import { asyncHandler } from '../../common/async-handler.js';
import { ok } from '../../common/http.js';
import { unauthenticated } from '../../common/errors.js';
import { acceptQuotation } from '../jobs/jobs.service.js';

const quotationIdSchema = z.object({ quotationId: z.string().uuid() });

function userId(req: Request): string {
  if (!req.user) throw unauthenticated();
  return req.user.id;
}

export const acceptQuotationController = asyncHandler(async (req: Request, res: Response) => {
  const { quotationId } = quotationIdSchema.parse(req.params);
  const result = await acceptQuotation(userId(req), quotationId);
  ok(res, result);
});