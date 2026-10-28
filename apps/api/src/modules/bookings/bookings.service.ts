import { prisma } from '../../lib/prisma.js';
import { notFound, forbidden, validationError, businessRuleViolation, conflict } from '../../common/errors.js';

export interface BookingView {
  id: string;
  jobId: string;
  quotationId: string;
  status: string;
  agreedAmount: string;
  currency: string;
  scheduledAt: string | null;
  completedAt: string | null;
  createdAt: string;
  jobStatus: string;
}

async function loadBooking(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      job: true,
      quotation: { include: { expert: { include: { user: { select: { id: true, name: true } } } } } },
      review: true,
      statusHistory: { orderBy: { createdAt: 'asc' } },
    },
  });
  if (!booking) throw notFound('Booking not found.');
  return booking;
}

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  in_progress: ['completed', 'cancelled', 'disputed'],
  completed: ['disputed'],
  cancelled: ['in_progress'],
  disputed: ['in_progress', 'completed', 'cancelled'],
};

function participantIds(booking: Awaited<ReturnType<typeof loadBooking>>) {
  return {
    customerId: booking.job.customerId,
    expertUserId: booking.quotation.expert.userId,
  };
}

export async function getBooking(bookingId: string, userId: string) {
  const booking = await loadBooking(bookingId);
  const { customerId, expertUserId } = participantIds(booking);
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const isAdmin = !!user?.roles.includes('admin');
  if (!isAdmin && userId !== customerId && userId !== expertUserId) throw forbidden();
  return toView(booking);
}

function toView(booking: Awaited<ReturnType<typeof loadBooking>>): BookingView {
  return {
    id: booking.id,
    jobId: booking.jobId,
    quotationId: booking.quotationId,
    status: booking.status,
    agreedAmount: booking.agreedAmount.toString(),
    currency: booking.currency,
    scheduledAt: booking.scheduledAt ? booking.scheduledAt.toISOString() : null,
    completedAt: booking.completedAt ? booking.completedAt.toISOString() : null,
    createdAt: booking.createdAt.toISOString(),
    jobStatus: booking.job.status,
  };
}

export async function transitionBookingStatus(
  userId: string,
  bookingId: string,
  newStatus: string,
  note?: string,
): Promise<BookingView> {
  const booking = await loadBooking(bookingId);
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw forbidden();
  const isAdmin = user.roles.includes('admin');
  const { customerId, expertUserId } = participantIds(booking);
  const isCustomer = userId === customerId;
  const isExpert = userId === expertUserId;
  if (!isAdmin && !isCustomer && !isExpert) throw forbidden();

  const current = booking.status;
  if (current === newStatus) {
    return toView(booking);
  }
  const allowed = ALLOWED_TRANSITIONS[current] ?? [];
  if (!allowed.includes(newStatus)) {
    throw businessRuleViolation(`Transition from ${current} to ${newStatus} is not allowed.`);
  }

  if (newStatus === 'completed' && !isCustomer && !isAdmin) {
    throw forbidden('Only the customer can mark the booking completed.');
  }
  if ((current === 'cancelled' || current === 'disputed') && newStatus === 'in_progress' && !isAdmin) {
    throw forbidden('Only an admin can reopen a booking.');
  }

  await prisma.$transaction(async (tx) => {
    await tx.booking.update({
      where: { id: bookingId },
      data: {
        status: newStatus as any,
        completedAt: newStatus === 'completed' ? new Date() : booking.completedAt,
      },
    });
    await tx.jobRequest.update({
      where: { id: booking.jobId },
      data: { status: newStatus as any },
    });
    await tx.jobStatusHistory.create({
      data: {
        bookingId,
        actorId: userId,
        oldStatus: current as any,
        newStatus: newStatus as any,
        note: note ?? null,
      },
    });
  });

  const refreshed = await loadBooking(bookingId);
  return toView(refreshed);
}

export async function cancelBooking(userId: string, bookingId: string, note?: string): Promise<BookingView> {
  return transitionBookingStatus(userId, bookingId, 'cancelled', note);
}

export interface ReviewView {
  id: string;
  bookingId: string;
  reviewerId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

export async function createReview(
  userId: string,
  bookingId: string,
  rating: number,
  comment?: string,
): Promise<ReviewView> {
  const booking = await loadBooking(bookingId);
  const { customerId } = participantIds(booking);
  if (userId !== customerId) throw forbidden('Only the booking customer can review.');
  if (booking.status !== 'completed' && booking.job.status !== 'completed') {
    throw businessRuleViolation('Review is only allowed after completion.');
  }
  const existing = await prisma.review.findUnique({ where: { bookingId } });
  if (existing) throw conflict('A review already exists for this booking.');

  const review = await prisma.review.create({
    data: {
      bookingId,
      reviewerId: userId,
      rating,
      comment: comment ?? null,
    },
  });
  return {
    id: review.id,
    bookingId: review.bookingId,
    reviewerId: review.reviewerId,
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt.toISOString(),
  };
}

export interface ReportView {
  id: string;
  bookingId: string;
  reporterId: string;
  reason: string;
  description: string | null;
  status: string;
  assignedAdminId: string | null;
  resolution: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

export async function createReport(
  userId: string,
  bookingId: string,
  reason: string,
  description?: string,
): Promise<ReportView> {
  const booking = await loadBooking(bookingId);
  const { customerId, expertUserId } = participantIds(booking);
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const isAdmin = !!user?.roles.includes('admin');
  if (!isAdmin && userId !== customerId && userId !== expertUserId) throw forbidden();
  const report = await prisma.report.create({
    data: {
      bookingId,
      reporterId: userId,
      reason,
      description: description ?? null,
      status: 'open',
    },
  });
  return toReportView(report);
}

export async function createReportFromInput(
  userId: string,
  input: { bookingId?: string; reason: string; description?: string },
): Promise<ReportView> {
  if (!input.bookingId) throw validationError('bookingId is required.');
  return createReport(userId, input.bookingId, input.reason, input.description);
}

function toReportView(r: any): ReportView {
  return {
    id: r.id,
    bookingId: r.bookingId,
    reporterId: r.reporterId,
    reason: r.reason,
    description: r.description ?? null,
    status: r.status,
    assignedAdminId: r.assignedAdminId ?? null,
    resolution: r.resolution ?? null,
    createdAt: r.createdAt.toISOString(),
    resolvedAt: r.resolvedAt ? r.resolvedAt.toISOString() : null,
  };
}

export async function listReports(status?: string) {
  const where: any = {};
  if (status) where.status = status;
  const reports = await prisma.report.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  return reports.map(toReportView);
}

export async function resolveReport(
  adminId: string,
  reportId: string,
  resolution: string,
  status?: string,
): Promise<ReportView> {
  const report = await prisma.report.findUnique({ where: { id: reportId } });
  if (!report) throw notFound('Report not found.');
  const updated = await prisma.report.update({
    where: { id: reportId },
    data: {
      status: status ?? 'resolved',
      resolution,
      assignedAdminId: adminId,
      resolvedAt: new Date(),
    },
  });
  return toReportView(updated);
}

export async function listExpertReviews(expertUserId: string) {
  const bookings = await prisma.booking.findMany({
    where: { quotation: { expert: { userId: expertUserId } } },
    include: { review: true },
  });
  return bookings
    .filter((b) => b.review)
    .map((b) => ({
      id: b.review!.id,
      bookingId: b.id,
      reviewerId: b.review!.reviewerId,
      rating: b.review!.rating,
      comment: b.review!.comment,
      createdAt: b.review!.createdAt.toISOString(),
    }));
}