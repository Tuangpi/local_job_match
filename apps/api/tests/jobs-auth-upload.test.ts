import { beforeAll, afterAll, describe, it } from 'vitest';
import request from 'supertest';
import crypto from 'node:crypto';

import { createApp, API_PREFIX } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { hashValue } from './helpers.js';

const app = createApp();

describe('jobs authorization and uploads', () => {
  let ownerId: string;
  let ownerToken: string;
  let otherId: string;
  let otherToken: string;
  let categoryId: string;
  let townshipId: string;
  let jobId: string;

  beforeAll(async () => {
    const owner = await prisma.user.create({ data: { phone: `+959${Date.now()}${Math.floor(Math.random()*1000000)}1`, name: 'Owner', status: 'active', roles: ['customer'] } });
    ownerId = owner.id;
    ownerToken = crypto.randomBytes(32).toString('base64url');
    await prisma.session.create({ data: { userId: ownerId, tokenHash: hashValue(ownerToken), expiresAt: new Date(Date.now() + 60 * 60 * 1000) } });

    const other = await prisma.user.create({ data: { phone: `+959${Date.now()}${Math.floor(Math.random()*1000000)}2`, name: 'Other', status: 'active', roles: ['customer'] } });
    otherId = other.id;
    otherToken = crypto.randomBytes(32).toString('base64url');
    await prisma.session.create({ data: { userId: otherId, tokenHash: hashValue(otherToken), expiresAt: new Date(Date.now() + 60 * 60 * 1000) } });

    const category = await prisma.category.findFirst({ where: { isActive: true } });
    const township = await prisma.township.findFirst();
    if (!category || !township) throw new Error('seed missing');
    categoryId = category.id;
    townshipId = township.id;

    const res = await request(app).post(`${API_PREFIX}/jobs`).set('Cookie', `sid=${ownerToken}`).send({
      categoryId, townshipId, jobType: 'one_day', title: 'Job', description: 'Desc',
    }).expect(201);
    jobId = res.body.data.id;
  });

  afterAll(async () => {
    await prisma.jobPhoto.deleteMany({ where: { jobId } });
    await prisma.jobRequest.deleteMany({ where: { id: jobId } });
    await prisma.session.deleteMany({ where: { userId: { in: [ownerId, otherId] } } });
    await prisma.user.deleteMany({ where: { id: { in: [ownerId, otherId] } } });
    await prisma.$disconnect();
  });

  it('rejects missing required fields', async () => {
    await request(app).post(`${API_PREFIX}/jobs`).set('Cookie', `sid=${ownerToken}`).send({ title: 'x' }).expect(400);
  });

  it('rejects edit by other user', async () => {
    await request(app).patch(`${API_PREFIX}/jobs/${jobId}`).set('Cookie', `sid=${otherToken}`).send({ title: 'hack' }).expect(403);
  });

  it('rejects upload by non-owner', async () => {
    const buf = Buffer.from('fakeimage');
    await request(app)
      .post(`${API_PREFIX}/jobs/${jobId}/photos`)
      .set('Cookie', `sid=${otherToken}`)
      .attach('photo', buf, { filename: 'test.jpg', contentType: 'image/jpeg' })
      .expect(403);
  });

  it('rejects oversized upload', async () => {
    const big = Buffer.alloc(9 * 1024 * 1024, 0);
    await request(app)
      .post(`${API_PREFIX}/jobs/${jobId}/photos`)
      .set('Cookie', `sid=${ownerToken}`)
      .attach('photo', big, { filename: 'big.jpg', contentType: 'image/jpeg' })
      .expect(400);
  });

  it('rejects invalid content type', async () => {
    const buf = Buffer.from('notimage');
    await request(app)
      .post(`${API_PREFIX}/jobs/${jobId}/photos`)
      .set('Cookie', `sid=${ownerToken}`)
      .attach('photo', buf, { filename: 'test.txt', contentType: 'text/plain' })
      .expect(400);
  });
});
