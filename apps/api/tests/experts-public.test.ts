import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp, API_PREFIX } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';

const app = createApp();

describe('GET /api/v1/experts/:expertId', () => {
  let expertUserId: string;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        phone: `+959${Date.now()}${Math.floor(Math.random()*1000000)}`,
        name: 'Test Expert',
        status: 'active',
        roles: ['expert'],
      },
    });
    expertUserId = user.id;
    await prisma.expertProfile.create({
      data: {
        userId: expertUserId,
        bio: 'Hello',
        experienceYears: 5,
        isAvailable: true,
      },
    });
  });

  afterAll(async () => {
    await prisma.expertSkill.deleteMany({ where: { expertId: expertUserId } });
    await prisma.expertArea.deleteMany({ where: { expertId: expertUserId } });
    await prisma.expertPortfolioItem.deleteMany({ where: { expertId: expertUserId } });
    await prisma.expertProfile.deleteMany({ where: { userId: expertUserId } });
    await prisma.user.delete({ where: { id: expertUserId } });
    await prisma.$disconnect();
  });

  it('returns public profile', async () => {
    const res = await request(app).get(`${API_PREFIX}/experts/${expertUserId}`).expect(200);
    expect(res.body.data).toMatchObject({
      expertId: expertUserId,
      userId: expertUserId,
      name: 'Test Expert',
      bio: 'Hello',
      experienceYears: 5,
      isAvailable: true,
    });
    expect(res.body.data.phone).toBeUndefined();
    expect(res.body.data.verificationStatus).toBe('unverified');
  });

  it('returns 404 for missing expert', async () => {
    await request(app)
      .get(`${API_PREFIX}/experts/00000000-0000-0000-0000-000000000000`)
      .expect(404);
  });

  it('returns 400 for invalid uuid', async () => {
    await request(app).get(`${API_PREFIX}/experts/not-a-uuid`).expect(400);
  });
});
