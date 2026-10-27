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