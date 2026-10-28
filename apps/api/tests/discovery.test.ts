import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';

import { createApp, API_PREFIX } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { createActiveUser } from './helpers.js';

const app = createApp();

describe('expert discovery', () => {
  let categoryId: string;
  let townshipId: string;
  let visibleExpertId: string;
  let hiddenExpertId: string;
  let suspendedExpertId: string;

  beforeAll(async () => {
    const category = await prisma.category.findFirst({ where: { isActive: true } });
    const township = await prisma.township.findFirst();
    if (!category || !township) throw new Error('seed missing');
    categoryId = category.id;
    townshipId = township.id;

    const visible = await createActiveUser(['expert'], 'Visible Expert');
    visibleExpertId = visible.id;
    await prisma.expertProfile.create({
      data: {
        userId: visibleExpertId,
        bio: 'Visible',
        isAvailable: true,
        verificationStatus: 'verified',
        skills: { create: [{ categoryId }] },
        areas: { create: [{ townshipId }] },
      },
    });

    const hidden = await createActiveUser(['expert'], 'Hidden Expert');
    hiddenExpertId = hidden.id;
    await prisma.expertProfile.create({
      data: {
        userId: hiddenExpertId,
        bio: 'Hidden',
        isAvailable: false,
        skills: { create: [{ categoryId }] },
        areas: { create: [{ townshipId }] },
      },
    });

    const suspended = await createActiveUser(['expert'], 'Suspended Expert');
    suspendedExpertId = suspended.id;
    await prisma.user.update({ where: { id: suspendedExpertId }, data: { status: 'suspended' } });
    await prisma.expertProfile.create({
      data: {
        userId: suspendedExpertId,
        bio: 'Suspended',
        isAvailable: true,
        skills: { create: [{ categoryId }] },
        areas: { create: [{ townshipId }] },
      },
    });
  });

  afterAll(async () => {
    for (const id of [visibleExpertId, hiddenExpertId, suspendedExpertId]) {
      await prisma.expertSkill.deleteMany({ where: { expertId: id } });
      await prisma.expertArea.deleteMany({ where: { expertId: id } });
      await prisma.expertPortfolioItem.deleteMany({ where: { expertId: id } });
      await prisma.expertProfile.deleteMany({ where: { userId: id } });
      await prisma.session.deleteMany({ where: { userId: id } });
      await prisma.user.deleteMany({ where: { id } });
    }
    await prisma.$disconnect();
  });

  it('filters by category and township', async () => {
    const res = await request(app)
      .get(`${API_PREFIX}/experts`)
      .query({ categoryId, townshipId })
      .expect(200);
    const ids = res.body.data.items.map((i: any) => i.userId);
    expect(ids).toContain(visibleExpertId);
    expect(ids).not.toContain(hiddenExpertId);
    expect(ids).not.toContain(suspendedExpertId);
  });

  it('does not expose private fields', async () => {
    const res = await request(app).get(`${API_PREFIX}/experts/${visibleExpertId}`).expect(200);
    expect(res.body.data.phone).toBeUndefined();
    expect(res.body.data.verificationStatus).toBe('verified');
  });
});
