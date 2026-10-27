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

describe('jobs', () => {
  let userId: string;
  let token: string;
  let categoryId: string;
  let townshipId: string;
  let jobId: string;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: { phone: `+959${Date.now()}${Math.floor(Math.random()*100000)}`, name: 'Customer', status: 'active', roles: ['customer'] },
    });
    userId = user.id;
    token = crypto.randomBytes(32).toString('base64url');
    await prisma.session.create({
      data: { userId, tokenHash: hashValue(token), expiresAt: new Date(Date.now() + 1000 * 60 * 60) },
    });

    const category = await prisma.category.findFirst({ where: { isActive: true } });
    const township = await prisma.township.findFirst();
    if (!category || !township) throw new Error('Seed data missing');
    categoryId = category.id;
    townshipId = township.id;
  });

  afterAll(async () => {
    if (jobId) {
      await prisma.jobPhoto.deleteMany({ where: { jobId } });
      await prisma.jobRequest.deleteMany({ where: { id: jobId } });
    }
    await prisma.session.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });
    await prisma.$disconnect();
  });

  it('creates job', async () => {
    const res = await request(app)
      .post(`${API_PREFIX}/jobs`)
      .set('Cookie', `sid=${token}`)
      .send({ categoryId, townshipId, jobType: 'one_day', title: 'Fix pipe', description: 'Leaking' })
      .expect(201);
    jobId = res.body.data.id;
    expect(res.body.data.status).toBe('open');
    expect(res.body.data.title).toBe('Fix pipe');
  });

  it('edits job', async () => {
    const res = await request(app)
      .patch(`${API_PREFIX}/jobs/${jobId}`)
      .set('Cookie', `sid=${token}`)
      .send({ title: 'Fix pipe v2', budgetMin: 1000, budgetMax: 2000 })
      .expect(200);
    expect(res.body.data.title).toBe('Fix pipe v2');
    expect(res.body.data.budgetMin).toBe('1000');
  });

  it('rejects edit by other user', async () => {
    const other = await prisma.user.create({ data: { phone: `+959${Date.now()}${Math.floor(Math.random()*100000)}9`, name: 'Other', status: 'active', roles: ['customer'] } });
    const otherToken = crypto.randomBytes(32).toString('base64url');
    await prisma.session.create({ data: { userId: other.id, tokenHash: hashValue(otherToken), expiresAt: new Date(Date.now() + 1000 * 60 * 60) } });
    await request(app).patch(`${API_PREFIX}/jobs/${jobId}`).set('Cookie', `sid=${otherToken}`).send({ title: 'hack' }).expect(403);
    await prisma.session.deleteMany({ where: { userId: other.id } });
    await prisma.user.delete({ where: { id: other.id } });
  });

  it('uploads photo', async () => {
    const buf = Buffer.from('fakeimage');
    const res = await request(app)
      .post(`${API_PREFIX}/jobs/${jobId}/photos`)
      .set('Cookie', `sid=${token}`)
      .attach('photo', buf, { filename: 'test.jpg', contentType: 'image/jpeg' })
      .expect(201);
    expect(res.body.data.storageKey).toMatch(/\.jpg$/);
  });

  it('rejects invalid photo type', async () => {
    const buf = Buffer.from('notimage');
    await request(app)
      .post(`${API_PREFIX}/jobs/${jobId}/photos`)
      .set('Cookie', `sid=${token}`)
      .attach('photo', buf, { filename: 'test.txt', contentType: 'text/plain' })
      .expect(400);
  });
});