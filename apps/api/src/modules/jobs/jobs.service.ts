import { prisma } from '../../lib/prisma.js';
import { env } from '../../config/env.js';
import { notFound, forbidden, validationError, businessRuleViolation, conflict } from '../../common/errors.js';
import { LocalFileStorage, isAllowedImageMimeType } from '../../lib/storage.js';
import type { CreateJobInput, UpdateJobInput, InviteExpertsInput, QuotationInput } from './jobs.schemas.js';

export interface JobPhotoView {
  id: string;
  storageKey: string;
  createdAt: string;
}

export interface JobQuotationView {
  id: string;
  jobId: string;
  expertId: string;
  expertName: string;
  expertVerificationStatus: string;
  laborAmount: string;
  materialsAmount: string;
  currency: string;
  scope: string;
  estimatedDays: number | null;
  validUntil: string | null;
  status: string;
  createdAt: string;
}

export interface JobView {
  id: string;
  customerId: string;
  categoryId: string;
  townshipId: string;
  jobType: string;
  title: string;
  description: string;
  budgetMin: string | null;
  budgetMax: string | null;
  currency: string;
  preferredDate: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  photos: JobPhotoView[];
  quotations: JobQuotationView[];
}

const storage = new LocalFileStorage(env.uploadDir, env.maxUploadSizeMb * 1024 * 1024);

async function loadJob(jobId: string) {
  const job = await prisma.jobRequest.findUnique({
    where: { id: jobId },
    include: {
      photos: true,
      quotations: {
        include: {
          expert: { include: { user: { select: { name: true } } } },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });
  if (!job) throw notFound('Job not found.');
  return job;
}

function toView(job: {
  id: string;
  customerId: string;
  categoryId: string;
  townshipId: string;
  jobType: string;
  title: string;
  description: string;
  budgetMin: bigint | null;
  budgetMax: bigint | null;
  currency: string;
  preferredDate: Date | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  photos: { id: string; storageKey: string; createdAt: Date }[];
  quotations?: {
    id: string;
    jobId: string;
    expertId: string;
    laborAmount: bigint;
    materialsAmount: bigint;
    currency: string;
    scope: string;
    estimatedDays: number | null;
    validUntil: Date | null;
    status: string;
    createdAt: Date;
    expert: { verificationStatus?: string; user: { name: string } };
  }[];
}): JobView {
  return {
    id: job.id,
    customerId: job.customerId,
    categoryId: job.categoryId,
    townshipId: job.townshipId,
    jobType: job.jobType,
    title: job.title,
    description: job.description,
    budgetMin: job.budgetMin === null ? null : job.budgetMin.toString(),
    budgetMax: job.budgetMax === null ? null : job.budgetMax.toString(),
    currency: job.currency,
    preferredDate: job.preferredDate ? job.preferredDate.toISOString().slice(0, 10) : null,
    status: job.status,
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
    photos: job.photos.map((photo) => ({
      id: photo.id,
      storageKey: photo.storageKey,
      createdAt: photo.createdAt.toISOString(),
    })),
    quotations: (job.quotations ?? []).map((q) => ({
      id: q.id,
      jobId: q.jobId,
      expertId: q.expertId,
      expertName: q.expert.user.name,
      expertVerificationStatus: q.expert.verificationStatus ?? 'unverified',
      laborAmount: q.laborAmount.toString(),
      materialsAmount: q.materialsAmount.toString(),
      currency: q.currency,
      scope: q.scope,
      estimatedDays: q.estimatedDays,
      validUntil: q.validUntil ? q.validUntil.toISOString() : null,
      status: q.status,
      createdAt: q.createdAt.toISOString(),
    })),
  };
}

export async function createJob(customerId: string, input: CreateJobInput): Promise<JobView> {
  const category = await prisma.category.findUnique({ where: { id: input.categoryId } });
  if (!category || !category.isActive) throw validationError('Invalid or inactive category.');

  const township = await prisma.township.findUnique({ where: { id: input.townshipId } });
  if (!township) throw validationError('Invalid township.');

  if (input.budgetMin !== undefined && input.budgetMax !== undefined && input.budgetMin > input.budgetMax) {
    throw validationError('budgetMin cannot exceed budgetMax.');
  }

  const job = await prisma.jobRequest.create({
    data: {
      customerId,
      categoryId: input.categoryId,
      townshipId: input.townshipId,
      jobType: input.jobType,
      title: input.title,
      description: input.description,
      budgetMin: input.budgetMin !== undefined ? BigInt(input.budgetMin) : null,
      budgetMax: input.budgetMax !== undefined ? BigInt(input.budgetMax) : null,
      currency: input.currency,
      preferredDate: input.preferredDate ? new Date(input.preferredDate) : null,
      status: 'open',
    },
    include: { photos: true },
  });

  return toView(job);
}

export async function getJob(jobId: string, userId: string): Promise<JobView> {
  const job = await loadJob(jobId);
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const isAdmin = !!user?.roles.includes('admin');
  const isOwner = job.customerId === userId;
  const hasQuotation = job.quotations.some((q) => q.expertId === userId);
  const hasInvitation = !!(await prisma.jobInvitation.findFirst({ where: { jobId, expertId: userId } }));
  if (!isOwner && !isAdmin && !hasQuotation && !hasInvitation) throw forbidden();
  return toView(job);
}

export async function updateJob(customerId: string, jobId: string, input: UpdateJobInput): Promise<JobView> {
  const job = await loadJob(jobId);
  if (job.customerId !== customerId) throw forbidden();
  if (!['open', 'draft'].includes(job.status)) {
    throw businessRuleViolation('Only open or draft jobs can be edited.');
  }

  if (input.categoryId !== undefined) {
    const category = await prisma.category.findUnique({ where: { id: input.categoryId } });
    if (!category || !category.isActive) throw validationError('Invalid or inactive category.');
  }
  if (input.townshipId !== undefined) {
    const township = await prisma.township.findUnique({ where: { id: input.townshipId } });
    if (!township) throw validationError('Invalid township.');
  }

  const budgetMin = input.budgetMin === undefined ? undefined : input.budgetMin === null ? null : BigInt(input.budgetMin);
  const budgetMax = input.budgetMax === undefined ? undefined : input.budgetMax === null ? null : BigInt(input.budgetMax);

  const effectiveMin = budgetMin === undefined ? job.budgetMin : budgetMin;
  const effectiveMax = budgetMax === undefined ? job.budgetMax : budgetMax;
  if (effectiveMin !== null && effectiveMax !== null && effectiveMin > effectiveMax) {
    throw validationError('budgetMin cannot exceed budgetMax.');
  }

  const data: Record<string, unknown> = {};
  if (input.categoryId !== undefined) data.categoryId = input.categoryId;
  if (input.townshipId !== undefined) data.townshipId = input.townshipId;
  if (input.jobType !== undefined) data.jobType = input.jobType;
  if (input.title !== undefined) data.title = input.title;
  if (input.description !== undefined) data.description = input.description;
  if (budgetMin !== undefined) data.budgetMin = budgetMin;
  if (budgetMax !== undefined) data.budgetMax = budgetMax;
  if (input.currency !== undefined) data.currency = input.currency;
  if (input.preferredDate !== undefined) {
    data.preferredDate = input.preferredDate ? new Date(input.preferredDate) : null;
  }
  if (input.status !== undefined) data.status = input.status;

  const updated = await prisma.jobRequest.update({
    where: { id: jobId },
    data,
    include: { photos: true },
  });

  return toView(updated);
}

export async function addJobPhoto(
  customerId: string,
  jobId: string,
  file: { buffer: Buffer; mimetype: string; size: number },
): Promise<JobPhotoView> {
  const job = await loadJob(jobId);
  if (job.customerId !== customerId) throw forbidden();
  if (!['open', 'draft'].includes(job.status)) {
    throw businessRuleViolation('Photos can only be added to open or draft jobs.');
  }

  if (!isAllowedImageMimeType(file.mimetype)) {
    throw validationError('Unsupported file type.');
  }
  if (file.size > env.maxUploadSizeMb * 1024 * 1024) {
    throw validationError('File too large.');
  }

  const stored = await storage.save(file.buffer, file.mimetype);

  const photo = await prisma.jobPhoto.create({
    data: { jobId, storageKey: stored.storageKey },
  });

  return {
    id: photo.id,
    storageKey: photo.storageKey,
    createdAt: photo.createdAt.toISOString(),
  };
}

export interface InvitationView {
  id: string;
  jobId: string;
  expertId: string;
  invitedBy: string;
  status: string;
  createdAt: string;
}

export async function inviteExperts(
  customerId: string,
  jobId: string,
  input: InviteExpertsInput,
): Promise<InvitationView[]> {
  const job = await loadJob(jobId);
  if (job.customerId !== customerId) throw forbidden();
  if (!['open', 'draft'].includes(job.status)) {
    throw businessRuleViolation('Invitations can only be sent for open or draft jobs.');
  }

  const expertIds = input.expertIds ?? (input.expertId ? [input.expertId] : []);
  const results: InvitationView[] = [];
  for (const expertId of expertIds) {
    const profile = await prisma.expertProfile.findUnique({ where: { userId: expertId } });
    if (!profile) throw validationError('Expert profile not found.');
    const invitation = await prisma.jobInvitation.upsert({
      where: { jobId_expertId: { jobId, expertId } },
      update: {},
      create: { jobId, expertId, invitedBy: customerId, status: 'pending' },
    });
    results.push({
      id: invitation.id,
      jobId: invitation.jobId,
      expertId: invitation.expertId,
      invitedBy: invitation.invitedBy,
      status: invitation.status,
      createdAt: invitation.createdAt.toISOString(),
    });
  }
  return results;
}

export interface QuotationView {
  id: string;
  jobId: string;
  expertId: string;
  laborAmount: string;
  materialsAmount: string;
  currency: string;
  scope: string;
  estimatedDays: number | null;
  validUntil: string | null;
  status: string;
  createdAt: string;
}

export async function submitQuotation(
  expertUserId: string,
  input: QuotationInput & { jobId?: string | undefined },
): Promise<QuotationView> {
  const profile = await prisma.expertProfile.findUnique({ where: { userId: expertUserId } });
  if (!profile) throw validationError('Expert profile not found.');

  const jobId = input.jobId;
  if (!jobId) throw validationError('jobId is required.');

  const job = await prisma.jobRequest.findUnique({ where: { id: jobId } });
  if (!job) throw notFound('Job not found.');
  if (job.status !== 'open') throw businessRuleViolation('Quotations can only be submitted for open jobs.');

  const existing = await prisma.quotation.findFirst({ where: { jobId, expertId: expertUserId } });
  let quotation;
  if (existing) {
    quotation = await prisma.quotation.update({
      where: { id: existing.id },
      data: {
        laborAmount: BigInt(input.laborAmount),
        materialsAmount: BigInt(input.materialsAmount),
        currency: input.currency,
        scope: input.scope,
        estimatedDays: input.estimatedDays ?? null,
        validUntil: input.validUntil ? new Date(input.validUntil) : null,
      },
    });
  } else {
    quotation = await prisma.quotation.create({
      data: {
        jobId,
        expertId: expertUserId,
        laborAmount: BigInt(input.laborAmount),
        materialsAmount: BigInt(input.materialsAmount),
        currency: input.currency,
        scope: input.scope,
        estimatedDays: input.estimatedDays ?? null,
        validUntil: input.validUntil ? new Date(input.validUntil) : null,
        status: 'pending',
      },
    });
  }

  return {
    id: quotation.id,
    jobId: quotation.jobId,
    expertId: quotation.expertId,
    laborAmount: quotation.laborAmount.toString(),
    materialsAmount: quotation.materialsAmount.toString(),
    currency: quotation.currency,
    scope: quotation.scope,
    estimatedDays: quotation.estimatedDays,
    validUntil: quotation.validUntil ? quotation.validUntil.toISOString() : null,
    status: quotation.status,
    createdAt: quotation.createdAt.toISOString(),
  };
}

export async function listJobQuotations(jobId: string, userId: string): Promise<JobQuotationView[]> {
  const job = await loadJob(jobId);
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const isAdmin = !!user?.roles.includes('admin');
  const isOwner = job.customerId === userId;
  const hasQuotation = job.quotations.some((q) => q.expertId === userId);
  const hasInvitation = !!(await prisma.jobInvitation.findFirst({ where: { jobId, expertId: userId } }));
  if (!isOwner && !isAdmin && !hasQuotation && !hasInvitation) throw forbidden();
  return job.quotations.map((q) => ({
    id: q.id,
    jobId: q.jobId,
    expertId: q.expertId,
    expertName: q.expert.user.name,
    expertVerificationStatus: q.expert.verificationStatus ?? 'unverified',
    laborAmount: q.laborAmount.toString(),
    materialsAmount: q.materialsAmount.toString(),
    currency: q.currency,
    scope: q.scope,
    estimatedDays: q.estimatedDays,
    validUntil: q.validUntil ? q.validUntil.toISOString() : null,
    status: q.status,
    createdAt: q.createdAt.toISOString(),
  }));
}

export interface BookingView {
  id: string;
  jobId: string;
  quotationId: string;
  status: string;
  agreedAmount: string;
  currency: string;
  createdAt: string;
}

export async function acceptQuotation(
  customerId: string,
  quotationId: string,
): Promise<BookingView> {
  const quotation = await prisma.quotation.findUnique({
    where: { id: quotationId },
    include: { job: true },
  });
  if (!quotation) throw notFound('Quotation not found.');
  if (quotation.job.customerId !== customerId) throw forbidden();
  if (quotation.status !== 'pending') {
    throw conflict('Quotation is not pending.');
  }
  if (quotation.validUntil && quotation.validUntil.getTime() < Date.now()) {
    throw businessRuleViolation('Quotation has expired.');
  }
  if (quotation.job.status !== 'open') {
    throw conflict('Job is not open.');
  }

  const agreedAmount = quotation.laborAmount + quotation.materialsAmount;

  const booking = await prisma.$transaction(async (tx) => {
    const updatedJob = await tx.jobRequest.updateMany({
      where: { id: quotation.jobId, status: 'open' },
      data: { status: 'in_progress' },
    });
    if (updatedJob.count !== 1) {
      throw conflict('Job is no longer open.');
    }

    const createdBooking = await tx.booking.create({
      data: {
        jobId: quotation.jobId,
        quotationId: quotation.id,
        status: 'in_progress',
        agreedAmount,
        currency: quotation.currency,
      },
    });

    await tx.quotation.update({
      where: { id: quotation.id },
      data: { status: 'accepted' },
    });

    await tx.quotation.updateMany({
      where: { jobId: quotation.jobId, id: { not: quotation.id }, status: 'pending' },
      data: { status: 'rejected' },
    });

    await tx.jobStatusHistory.create({
      data: {
        bookingId: createdBooking.id,
        actorId: customerId,
        oldStatus: 'open',
        newStatus: 'in_progress',
        note: 'Quotation accepted.',
      },
    });

    return createdBooking;
  });

  return {
    id: booking.id,
    jobId: booking.jobId,
    quotationId: booking.quotationId,
    status: booking.status,
    agreedAmount: booking.agreedAmount.toString(),
    currency: booking.currency,
    createdAt: booking.createdAt.toISOString(),
  };
}
