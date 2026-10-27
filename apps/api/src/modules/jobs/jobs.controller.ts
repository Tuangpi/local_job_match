import type { Request, Response } from 'express';
import multer from 'multer';

import { asyncHandler } from '../../common/async-handler.js';
import { ok, created } from '../../common/http.js';
import { unauthenticated, validationError } from '../../common/errors.js';
import {
  createJob,
  getJob,
  updateJob,
  addJobPhoto,
  inviteExperts,
  submitQuotation,
} from './jobs.service.js';
import {
  createJobSchema,
  updateJobSchema,
  jobIdParamSchema,
  inviteExpertsSchema,
  quotationSchema,
} from './jobs.schemas.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    const allowed = new Set(['image/jpeg', 'image/png', 'image/webp']);
    if (!allowed.has(file.mimetype)) {
      cb(new Error('Unsupported file type.'));
      return;
    }
    cb(null, true);
  },
});

function userId(req: Request): string {
  if (!req.user) throw unauthenticated();
  return req.user.id;
}

export const createJobController = asyncHandler(async (req: Request, res: Response) => {
  const input = createJobSchema.parse(req.body ?? {});
  const job = await createJob(userId(req), input);
  created(res, job);
});

export const getJobController = asyncHandler(async (req: Request, res: Response) => {
  const { jobId } = jobIdParamSchema.parse(req.params);
  if (!req.user) throw unauthenticated();
  const job = await getJob(jobId, req.user.id);
  ok(res, job);
});

export const updateJobController = asyncHandler(async (req: Request, res: Response) => {
  const { jobId } = jobIdParamSchema.parse(req.params);
  const input = updateJobSchema.parse(req.body ?? {});
  const job = await updateJob(userId(req), jobId, input);
  ok(res, job);
});

export const uploadJobPhotoController = asyncHandler(async (req: Request, res: Response) => {
  const { jobId } = jobIdParamSchema.parse(req.params);
  const file = (req.files as Express.Multer.File[] | undefined)?.[0] ?? (req.file as Express.Multer.File | undefined);
  if (!file) throw validationError('A photo file is required.');
  const photo = await addJobPhoto(userId(req), jobId, {
    buffer: file.buffer,
    mimetype: file.mimetype,
    size: file.size,
  });
  created(res, photo);
});

export const inviteExpertsController = asyncHandler(async (req: Request, res: Response) => {
  const { jobId } = jobIdParamSchema.parse(req.params);
  const input = inviteExpertsSchema.parse(req.body ?? {});
  const result = await inviteExperts(userId(req), jobId, input);
  created(res, result);
});

export const submitQuotationByJobController = asyncHandler(async (req: Request, res: Response) => {
  const { jobId } = jobIdParamSchema.parse(req.params);
  const input = quotationSchema.parse(req.body ?? {});
  const result = await submitQuotation(userId(req), { ...input, jobId } as any);
  created(res, result);
});

export const submitQuotationByExpertController = asyncHandler(async (req: Request, res: Response) => {
  const input = quotationSchema.parse(req.body ?? {});
  const result = await submitQuotation(userId(req), input);
  created(res, result);
});export { upload };
