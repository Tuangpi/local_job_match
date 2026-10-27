import { Router } from 'express';
import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';

import { requireAuth } from '../../middleware/auth.js';
import { validationError } from '../../common/errors.js';
import {
  createJobController,
  getJobController,
  updateJobController,
  uploadJobPhotoController,
  upload,
  inviteExpertsController,
  submitQuotationByJobController,
  listJobQuotationsController,
} from './jobs.controller.js';

export const jobsRouter: Router = Router();

function runUpload(req: Request, res: Response, next: NextFunction) {
  upload.any()(req, res, (err: unknown) => {
    if (!err) {
      next();
      return;
    }
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        next(validationError('File too large.'));
        return;
      }
      next(validationError(err.message));
      return;
    }
    next(validationError((err as Error).message || 'Invalid upload.'));
  });
}

jobsRouter.post('/', requireAuth, createJobController);
jobsRouter.get('/:jobId', requireAuth, getJobController);
jobsRouter.patch('/:jobId', requireAuth, updateJobController);
jobsRouter.post('/:jobId/photos', requireAuth, runUpload, uploadJobPhotoController);
jobsRouter.post('/:jobId/invitations', requireAuth, inviteExpertsController);
jobsRouter.get('/:jobId/quotations', requireAuth, listJobQuotationsController);
jobsRouter.post('/:jobId/quotations', requireAuth, submitQuotationByJobController);