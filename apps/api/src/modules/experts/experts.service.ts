import { prisma } from '../../lib/prisma.js';
import { conflict, notFound } from '../../common/errors.js';
import type {
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
