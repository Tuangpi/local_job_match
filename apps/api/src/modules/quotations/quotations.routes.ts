import { Router } from 'express';

import { requireAuth } from '../../middleware/auth.js';
import { acceptQuotationController } from './quotations.controller.js';

export const quotationsRouter: Router = Router();

quotationsRouter.post('/:quotationId/accept', requireAuth, acceptQuotationController);
quotationsRouter.patch('/:quotationId/accept', requireAuth, acceptQuotationController);