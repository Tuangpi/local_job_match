import { prisma } from '../../lib/prisma.js';
import { notFound, validationError } from '../../common/errors.js';
import type { VerificationDecisionInput } from './admin.schemas.js';

export interface AdminExpertVerificationItem {
  expertId: string;
  userId: string;
  name: string;
  bio: string | null;
  experienceYears: number | null;
  verificationStatus: string;
  isAvailable: boolean;
  createdAt: string;
  skills: { categoryId: string; experienceYears: number | null }[];
  areas: { townshipId: string }[];
  portfolio: { id: string; storageKey: string; caption: string | null }[];
}

function toVerificationStatus(value: string): 'verified' | 'rejected' {
  const normalized = value.trim().toLowerCase();
  if (['approve', 'approved', 'verify', 'verified', 'accept', 'accepted'].includes(normalized)) {
    return 'verified';
  }
  if (['reject', 'rejected', 'deny', 'denied', 'decline', 'declined'].includes(normalized)) {
    return 'rejected';
  }
  throw validationError('Invalid verification decision.');
}

export async function listPendingVerificationExperts(): Promise<AdminExpertVerificationItem[]> {
  const profiles = await prisma.expertProfile.findMany({
    where: { verificationStatus: 'pending' },
    include: {
      user: { select: { name: true, status: true } },
      skills: true,
      areas: true,
      portfolioItems: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  return profiles
    .filter((profile) => profile.user.status === 'active')
    .map((profile) => ({
      expertId: profile.userId,
      userId: profile.userId,
      name: profile.user.name,
      bio: profile.bio,
      experienceYears: profile.experienceYears,
      verificationStatus: profile.verificationStatus,
      isAvailable: profile.isAvailable,
      createdAt: profile.createdAt.toISOString(),
      skills: profile.skills.map((skill) => ({
        categoryId: skill.categoryId,
        experienceYears: skill.experienceYears,
      })),
      areas: profile.areas.map((area) => ({ townshipId: area.townshipId })),
      portfolio: profile.portfolioItems.map((item) => ({
        id: item.id,
        storageKey: item.storageKey,
        caption: item.caption,
      })),
    }));
}

export async function decideExpertVerification(
  adminId: string,
  expertId: string,
  input: VerificationDecisionInput,
): Promise<AdminExpertVerificationItem> {
  const profile = await prisma.expertProfile.findUnique({
    where: { userId: expertId },
    include: {
      user: { select: { name: true, status: true } },
      skills: true,
      areas: true,
      portfolioItems: true,
    },
  });
  if (!profile) throw notFound('Expert profile not found.');

function normalizeDecision(input: VerificationDecisionInput): 'verified' | 'rejected' {
  const entries = Object.entries(input);
  for (const [key, value] of entries) {
    const keyLower = key.toLowerCase();
    if (typeof value === 'boolean') {
      if (value) {
        if (keyLower.includes('reject') || keyLower.includes('deny') || keyLower.includes('decline')) {
          return 'rejected';
        }
        if (
          keyLower.includes('approv') ||
          keyLower.includes('verif') ||
          keyLower.includes('accept') ||
          keyLower.includes('verified')
        ) {
          return 'verified';
        }
      }
      continue;
    }
    if (typeof value === 'string') {
      try {
        return toVerificationStatus(value);
      } catch {
        // try key-based inference
        const v = value.trim().toLowerCase();
        if (v === 'true' || v === '1' || v === 'yes') {
          if (keyLower.includes('reject') || keyLower.includes('deny') || keyLower.includes('decline')) {
            return 'rejected';
          }
          if (keyLower.includes('approv') || keyLower.includes('verif') || keyLower.includes('accept')) {
            return 'verified';
          }
        }
      }
    }
    if (typeof value === 'number') {
      if (value === 1) {
        if (keyLower.includes('reject') || keyLower.includes('deny') || keyLower.includes('decline')) {
          return 'rejected';
        }
        if (keyLower.includes('approv') || keyLower.includes('verif') || keyLower.includes('accept')) {
          return 'verified';
        }
      }
    }
  }
  // Fallback: if body has a single string value, try it.
  const stringValues = entries.map(([, v]) => v).filter((v): v is string => typeof v === 'string');
  if (stringValues.length === 1) {
    try {
      return toVerificationStatus(stringValues[0]!);
    } catch {
      // ignore
    }
  }
  throw validationError('A verification decision is required.');
}

  const newStatus = normalizeDecision(input);

  const updated = await prisma.expertProfile.update({
    where: { userId: expertId },
    data: { verificationStatus: newStatus },
    include: {
      user: { select: { name: true, status: true } },
      skills: true,
      areas: true,
      portfolioItems: true,
    },
  });

  const { logAdminAction } = await import('../../common/audit.js');
  await logAdminAction(adminId, 'expert.verification.decision', 'expert', expertId, { status: newStatus });

  return {
    expertId: updated.userId,
    userId: updated.userId,
    name: updated.user.name,
    bio: updated.bio,
    experienceYears: updated.experienceYears,
    verificationStatus: updated.verificationStatus,
    isAvailable: updated.isAvailable,
    createdAt: updated.createdAt.toISOString(),
    skills: updated.skills.map((skill) => ({
      categoryId: skill.categoryId,
      experienceYears: skill.experienceYears,
    })),
    areas: updated.areas.map((area) => ({ townshipId: area.townshipId })),
    portfolio: updated.portfolioItems.map((item) => ({
      id: item.id,
      storageKey: item.storageKey,
      caption: item.caption,
    })),
  };
}
export interface AdminUserView {
  id: string;
  phone: string;
  name: string;
  status: string;
  roles: string[];
  createdAt: string;
}

export async function listUsers(): Promise<AdminUserView[]> {
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' }, take: 200 });
  return users.map((u) => ({
    id: u.id,
    phone: u.phone,
    name: u.name,
    status: u.status,
    roles: u.roles,
    createdAt: u.createdAt.toISOString(),
  }));
}

export async function updateUserStatus(adminId: string, userId: string, status: string): Promise<AdminUserView> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw notFound('User not found.');
  const updated = await prisma.user.update({ where: { id: userId }, data: { status: status as any } });
  const { logAdminAction } = await import('../../common/audit.js');
  await logAdminAction(adminId, 'user.status.update', 'user', userId, { from: user.status, to: status });
  return {
    id: updated.id,
    phone: updated.phone,
    name: updated.name,
    status: updated.status,
    roles: updated.roles,
    createdAt: updated.createdAt.toISOString(),
  };
}

export interface AdminCategoryView {
  id: string;
  parentId: string | null;
  slug: string;
  nameEn: string;
  nameMy: string | null;
  isActive: boolean;
}

export async function listCategoriesAdmin(): Promise<AdminCategoryView[]> {
  const cats = await prisma.category.findMany({ orderBy: { nameEn: 'asc' } });
  return cats.map((c) => ({
    id: c.id,
    parentId: c.parentId,
    slug: c.slug,
    nameEn: c.nameEn,
    nameMy: c.nameMy,
    isActive: c.isActive,
  }));
}

export async function createCategory(adminId: string, input: any): Promise<AdminCategoryView> {
  const created = await prisma.category.create({
    data: {
      parentId: input.parentId ?? null,
      slug: input.slug,
      nameEn: input.nameEn,
      nameMy: input.nameMy ?? null,
      isActive: input.isActive ?? true,
    },
  });
  const { logAdminAction } = await import('../../common/audit.js');
  await logAdminAction(adminId, 'category.create', 'category', created.id, { slug: created.slug });
  return {
    id: created.id,
    parentId: created.parentId,
    slug: created.slug,
    nameEn: created.nameEn,
    nameMy: created.nameMy,
    isActive: created.isActive,
  };
}

export async function updateCategory(adminId: string, categoryId: string, input: any): Promise<AdminCategoryView> {
  const existing = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!existing) throw notFound('Category not found.');
  const updated = await prisma.category.update({
    where: { id: categoryId },
    data: {
      parentId: input.parentId !== undefined ? input.parentId : existing.parentId,
      slug: input.slug ?? existing.slug,
      nameEn: input.nameEn ?? existing.nameEn,
      nameMy: input.nameMy !== undefined ? input.nameMy : existing.nameMy,
      isActive: input.isActive !== undefined ? input.isActive : existing.isActive,
    },
  });
  const { logAdminAction } = await import('../../common/audit.js');
  await logAdminAction(adminId, 'category.update', 'category', categoryId, input);
  return {
    id: updated.id,
    parentId: updated.parentId,
    slug: updated.slug,
    nameEn: updated.nameEn,
    nameMy: updated.nameMy,
    isActive: updated.isActive,
  };
}

export async function deleteCategory(adminId: string, categoryId: string): Promise<{ id: string }> {
  const existing = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!existing) throw notFound('Category not found.');
  await prisma.category.delete({ where: { id: categoryId } });
  const { logAdminAction } = await import('../../common/audit.js');
  await logAdminAction(adminId, 'category.delete', 'category', categoryId, { slug: existing.slug });
  return { id: categoryId };
}

export interface AdminAuditLogView {
  id: string;
  adminId: string;
  action: string;
  targetType: string;
  targetId: string | null;
  metadata: unknown;
  createdAt: string;
}

export async function listAuditLogs(limit: number): Promise<AdminAuditLogView[]> {
  const logs = await prisma.adminAuditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
  return logs.map((l) => ({
    id: l.id,
    adminId: l.adminId,
    action: l.action,
    targetType: l.targetType,
    targetId: l.targetId,
    metadata: l.metadata,
    createdAt: l.createdAt.toISOString(),
  }));
}

export interface AnalyticsView {
  users: { total: number; active: number; suspended: number };
  experts: { total: number };
  jobs: Record<string, number>;
  bookings: Record<string, number>;
  quotations: { total: number };
  reviews: { total: number; averageRating: number | null };
  reports: Record<string, number>;
}

export async function getAnalytics(): Promise<AnalyticsView> {
  const [usersTotal, usersActive, usersSuspended, expertsTotal, jobs, bookings, quotationsTotal, reviews, reports] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { status: 'active' } }),
    prisma.user.count({ where: { status: 'suspended' } }),
    prisma.expertProfile.count(),
    prisma.jobRequest.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.booking.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.quotation.count(),
    prisma.review.aggregate({ _count: { _all: true }, _avg: { rating: true } }),
    prisma.report.groupBy({ by: ['status'], _count: { _all: true } }),
  ]);
  const jobsMap: Record<string, number> = {};
  for (const j of jobs) jobsMap[j.status] = j._count._all;
  const bookingsMap: Record<string, number> = {};
  for (const b of bookings) bookingsMap[b.status] = b._count._all;
  const reportsMap: Record<string, number> = {};
  for (const r of reports) reportsMap[r.status] = r._count._all;
  return {
    users: { total: usersTotal, active: usersActive, suspended: usersSuspended },
    experts: { total: expertsTotal },
    jobs: jobsMap,
    bookings: bookingsMap,
    quotations: { total: quotationsTotal },
    reviews: { total: reviews._count._all, averageRating: reviews._avg.rating },
    reports: reportsMap,
  };
}
