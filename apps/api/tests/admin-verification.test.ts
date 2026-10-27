import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import crypto from 'node:crypto';
import { createApp, API_PREFIX } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { env } from '../src/config/env.js';

const app = createApp();

function hashValue(value: string): string {
  return crypto.createHash('sha256').update(value + env.authSessionSecret).digest('hex');
}

describe('admin verification queue', () => {
  let adminUserId: string;
  let expertUserId: string;
  let sessionToken: string;

  beforeAll(async () => {
    const admin = await prisma.user.create({
      data: { phone: `+959${Date.now()}1`, name: 'Admin', status: 'active', roles: ['admin'] },
    });
    adminUserId = admin.id;

    sessionToken = crypto.randomBytes(32).toString('base64url');
    await prisma.session.create({
      data: { userId: adminUserId, tokenHash: hashValue(sessionToken), expiresAt: new Date(Date.now() + 1000 * 60 * 60) },
    });

    const expert = await prisma.user.create({
      data: { phone: `+959${Date.now()}2`, name: 'Expert', status: 'active', roles: ['expert'] },
    });
    expertUserId = expert.id;
    await prisma.expertProfile.create({
      data: { userId: expertUserId, verificationStatus: 'pending' },
    });
  });

  afterAll(async () => {
    await prisma.session.deleteMany({ where: { userId: adminUserId } });
    await prisma.expertPortfolioItem.deleteMany({ where: { expertId: expertUserId } });
    await prisma.expertSkill.deleteMany({ where: { expertId: expertUserId } });
    await prisma.expertArea.deleteMany({ where: { expertId: expertUserId } });
    await prisma.expertProfile.deleteMany({ where: { userId: expertUserId } });
    await prisma.user.delete({ where: { id: expertUserId } });
    await prisma.user.delete({ where: { id: adminUserId } });
    await prisma.$disconnect();
  });

  it('requires auth', async () => {
    await request(app).get(`${API_PREFIX}/admin/experts/pending-verification`).expect(401);
  });

  it('lists pending experts for admin', async () => {
    const res = await request(app)
      .get(`${API_PREFIX}/admin/experts/pending-verification`)
      .set('Cookie', `sid=${sessionToken}`)
      .expect(200);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data[0].expertId).toBe(expertUserId);
    expect(res.body.data[0].verificationStatus).toBe('pending');
  });

  it('rejects non-admin', async () => {
    // create non-admin session
    const u = await prisma.user.create({ data: { phone: `+959${Date.now()}3`, name: 'Cust', status: 'active', roles: ['customer'] } });
    const tok = crypto.randomBytes(32).toString('base64url');
    await prisma.session.create({ data: { userId: u.id, tokenHash: hashValue(tok), expiresAt: new Date(Date.now() + 1000 * 60 * 60) } });
    await request(app).get(`${API_PREFIX}/admin/experts/pending-verification`).set('Cookie', `sid=${tok}`).expect(403);
    await prisma.session.deleteMany({ where: { userId: u.id } });
    await prisma.user.delete({ where: { id: u.id } });
  });

  it('approves expert', async () => {
    const res = await request(app)
      .post(`${API_PREFIX}/admin/experts/${expertUserId}/verification-decision`)
      .set('Cookie', `sid=${sessionToken}`)
      .send({ decision: 'approve' })
      .expect(200);
    expect(res.body.data.verificationStatus).toBe('verified');

    const profile = await prisma.expertProfile.findUnique({ where: { userId: expertUserId } });
    expect(profile?.verificationStatus).toBe('verified');
  });

  it('returns 404 for missing expert decision', async () => {
    await request(app)
      .post(`${API_PREFIX}/admin/experts/00000000-0000-0000-0000-000000000000/verification-decision`)
      .set('Cookie', `sid=${sessionToken}`)
      .send({ decision: 'reject' })
      .expect(404);
  });

  it('returns 400 for invalid uuid param', async () => {
    await request(app)
      .post(`${API_PREFIX}/admin/experts/not-a-uuid/verification-decision`)
      .set('Cookie', `sid=${sessionToken}`)
      .send({ decision: 'reject' })
      .expect(400);
  });
});