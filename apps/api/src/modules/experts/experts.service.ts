import { prisma } from '../../lib/prisma.js';
import { conflict, notFound } from '../../common/errors.js';
import { listExpertReviews } from '../bookings/bookings.service.js';
import type {
  ExpertsSearchQuery,
  CreateExpertProfileInput,
  UpdateExpertProfileInput,
  ReplaceSkillsInput,
  ReplaceAreasInput,
  ReplacePortfolioInput,
} from './experts.schemas.js';

export interface ExpertProfileView {
  userId: string;
  bio: string | null;
  experienceYears: number | null;
  verificationStatus: string;
  isAvailable: boolean;
  createdAt: string;
  skills: { categoryId: string; experienceYears: number | null }[];
  areas: { townshipId: string }[];
  portfolio: { id: string; storageKey: string; caption: string | null }[];
}

async function loadProfile(userId: string) {
  const profile = await prisma.expertProfile.findUnique({
    where: { userId },
    include: { skills: true, areas: true, portfolioItems: true },
  });
  if (!profile) throw notFound('Expert profile not found.');
  return profile;
}

export async function createExpertProfile(
  userId: string,
  input: CreateExpertProfileInput,
): Promise<ExpertProfileView> {
  const existing = await prisma.expertProfile.findUnique({ where: { userId } });
  if (existing) throw conflict('Expert profile already exists.');

  const data: { userId: string; isAvailable: boolean; bio?: string; experienceYears?: number } = {
    userId,
    isAvailable: input.isAvailable ?? true,
  };
  if (input.bio !== undefined) data.bio = input.bio;
  if (input.experienceYears !== undefined) data.experienceYears = input.experienceYears;

  await prisma.expertProfile.create({ data });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user && !user.roles.includes('expert')) {
    await prisma.user.update({
      where: { id: userId },
      data: { roles: { set: [...user.roles, 'expert'] } },
    });
  }

  return getExpertProfile(userId);
}

export async function getExpertProfile(userId: string): Promise<ExpertProfileView> {
  const profile = await loadProfile(userId);
  return toView(profile);
}

export async function updateExpertProfile(
  userId: string,
  input: UpdateExpertProfileInput,
): Promise<ExpertProfileView> {
  await loadProfile(userId);
  const data: { bio?: string; experienceYears?: number; isAvailable?: boolean } = {};
  if (input.bio !== undefined) data.bio = input.bio;
  if (input.experienceYears !== undefined) data.experienceYears = input.experienceYears;
  if (input.isAvailable !== undefined) data.isAvailable = input.isAvailable;

  await prisma.expertProfile.update({
    where: { userId },
    data,
  });
  return getExpertProfile(userId);
}

export async function replaceSkills(
  userId: string,
  input: ReplaceSkillsInput,
): Promise<ExpertProfileView> {
  await loadProfile(userId);

  await prisma.$transaction(async (tx) => {
    await tx.expertSkill.deleteMany({ where: { expertId: userId } });
    if (input.skills.length > 0) {
      await tx.expertSkill.createMany({
        data: input.skills.map((skill) => ({
          expertId: userId,
          categoryId: skill.categoryId,
          experienceYears: skill.experienceYears ?? null,
        })),
      });
    }
  });

  return getExpertProfile(userId);
}

export async function replaceAreas(
  userId: string,
  input: ReplaceAreasInput,
): Promise<ExpertProfileView> {
  await loadProfile(userId);

  await prisma.$transaction(async (tx) => {
    await tx.expertArea.deleteMany({ where: { expertId: userId } });
    if (input.townshipIds.length > 0) {
      await tx.expertArea.createMany({
        data: input.townshipIds.map((townshipId) => ({
          expertId: userId,
          townshipId,
        })),
      });
    }
  });

  return getExpertProfile(userId);
}

export async function replacePortfolio(
  userId: string,
  input: ReplacePortfolioInput,
): Promise<ExpertProfileView> {
  await loadProfile(userId);

  await prisma.$transaction(async (tx) => {
    await tx.expertPortfolioItem.deleteMany({ where: { expertId: userId } });
    if (input.items.length > 0) {
      await tx.expertPortfolioItem.createMany({
        data: input.items.map((item) => ({
          expertId: userId,
          storageKey: item.storageKey,
          caption: item.caption ?? null,
        })),
      });
    }
  });

  return getExpertProfile(userId);
}

export interface PublicExpertProfileView {
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

export async function getPublicExpertProfile(expertId: string): Promise<PublicExpertProfileView> {
  const profile = await prisma.expertProfile.findUnique({
    where: { userId: expertId },
    include: {
      user: { select: { name: true, status: true } },
      skills: true,
      areas: true,
      portfolioItems: true,
    },
  });

  if (!profile || profile.user.status !== 'active') {
    throw notFound('Expert profile not found.');
  }

  return {
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
  };
}
function toView(profile: {
  userId: string;
  bio: string | null;
  experienceYears: number | null;
  verificationStatus: string;
  isAvailable: boolean;
  createdAt: Date;
  skills: { categoryId: string; experienceYears: number | null }[];
  areas: { townshipId: string }[];
  portfolioItems: { id: string; storageKey: string; caption: string | null }[];
}): ExpertProfileView {
  return {
    userId: profile.userId,
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
  };
}

export interface ExpertSearchItem {
  userId: string;
  name: string;
  bio: string | null;
  experienceYears: number | null;
  verificationStatus: string;
  isAvailable: boolean;
  skills: { categoryId: string; experienceYears: number | null }[];
  areas: { townshipId: string }[];
}

export interface ExpertSearchResult {
  items: ExpertSearchItem[];
  nextCursor: string | null;
}

export async function searchExperts(query: ExpertsSearchQuery): Promise<ExpertSearchResult> {
  const where: {
    isAvailable: boolean;
    skills?: { some: { categoryId: string } };
    areas?: { some: { townshipId: string } };
  } = { isAvailable: true };

  if (query.categoryId) where.skills = { some: { categoryId: query.categoryId } };
  if (query.townshipId) where.areas = { some: { townshipId: query.townshipId } };

  let cursorFilter: Record<string, unknown> | undefined;
  if (query.cursor) {
    const decoded = decodeCursor(query.cursor);
    if (decoded) {
      cursorFilter = {
        OR: [
          { createdAt: { lt: decoded.createdAt } },
          { createdAt: decoded.createdAt, userId: { lt: decoded.userId } },
        ],
      };
    }
  }

  const profiles = await prisma.expertProfile.findMany({
    where: cursorFilter ? { ...where, ...cursorFilter } : where,
    include: {
      user: { select: { name: true } },
      skills: true,
      areas: true,
    },
    orderBy: [{ createdAt: 'desc' }, { userId: 'desc' }],
    take: query.limit + 1,
  });

  const hasMore = profiles.length > query.limit;
  const page = hasMore ? profiles.slice(0, query.limit) : profiles;

  const items: ExpertSearchItem[] = page.map((profile) => ({
    userId: profile.userId,
    name: profile.user.name,
    bio: profile.bio,
    experienceYears: profile.experienceYears,
    verificationStatus: profile.verificationStatus,
    isAvailable: profile.isAvailable,
    skills: profile.skills.map((skill) => ({
      categoryId: skill.categoryId,
      experienceYears: skill.experienceYears,
    })),
    areas: profile.areas.map((area) => ({ townshipId: area.townshipId })),
  }));

  const last = page[page.length - 1];
  const nextCursor = hasMore && last ? encodeCursor(last.createdAt, last.userId) : null;

  return { items, nextCursor };
}

function encodeCursor(createdAt: Date, userId: string): string {
  return Buffer.from(`${createdAt.toISOString()}|${userId}`).toString('base64url');
}

export async function getExpertReviews(expertId: string) {
  return listExpertReviews(expertId);
}

function decodeCursor(cursor: string): { createdAt: Date; userId: string } | null {
  try {
    const raw = Buffer.from(cursor, 'base64url').toString('utf8');
    const [iso, userId] = raw.split('|');
    if (!iso || !userId) return null;
    const createdAt = new Date(iso);
    if (Number.isNaN(createdAt.getTime())) return null;
    return { createdAt, userId };
  } catch {
    return null;
  }
}
