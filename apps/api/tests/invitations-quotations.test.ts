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

describe('invitations and quotations', () => {
  let customerUserId: string;
  let customerToken: string;
  let expertUserId: string;
  let expertToken: string;
  let categoryId: string;
  let townshipId: string;
  let jobId: string;

  beforeAll(async () => {
    const customer = await prisma.user.create({ data: { phone: `+959${Date.now()}${Math.floor(Math.random()*100000)}1`, name: 'Customer', status: 'active', roles: ['customer'] } });
    customerUserId = customer.id;
    customerToken = crypto.randomBytes(32).toString('base64url');
    await prisma.session.create({ data: { userId: customerUserId, tokenHash: hashValue(customerToken), expiresAt: new Date(Date.now() + 1000 * 60 * 60) } });

    const expert = await prisma.user.create({ data: { phone: `+959${Date.now()}${Math.floor(Math.random()*100000)}2`, name: 'Expert', status: 'active', roles: ['expert'] } });
    expertUserId = expert.id;
    expertToken = crypto.randomBytes(32).toString('base64url');
    await prisma.session.create({ data: { userId: expertUserId, tokenHash: hashValue(expertToken), expiresAt: new Date(Date.now() + 1000 * 60 * 60) } });
    await prisma.expertProfile.create({ data: { userId: expertUserId, verificationStatus: 'verified' } });

    const category = await prisma.category.findFirst({ where: { isActive: true } });
    const township = await prisma.township.findFirst();
    if (!category || !township) throw new Error('seed missing');
    categoryId = category.id;
    townshipId = township.id;

    const jobRes = await request(app).post(`${API_PREFIX}/jobs`).set('Cookie', `sid=${customerToken}`).send({
      categoryId, townshipId, jobType: 'one_day', title: 'Job', description: 'Desc',
    });
    jobId = jobRes.body.data.id;
  });

  afterAll(async () => {
    await prisma.quotation.deleteMany({ where: { jobId } });
    await prisma.jobInvitation.deleteMany({ where: { jobId } });
    await prisma.jobPhoto.deleteMany({ where: { jobId } });
    await prisma.jobRequest.deleteMany({ where: { id: jobId } });
    await prisma.expertProfile.deleteMany({ where: { userId: expertUserId } });
    await prisma.session.deleteMany({ where: { userId: { in: [customerUserId, expertUserId] } } });
    await prisma.user.deleteMany({ where: { id: { in: [customerUserId, expertUserId] } } });
    await prisma.$disconnect();
  });

  it('invites expert', async () => {
    const res = await request(app)
      .post(`${API_PREFIX}/jobs/${jobId}/invitations`)
      .set('Cookie', `sid=${customerToken}`)
      .send({ expertId: expertUserId })
      .expect(201);
    expect(res.body.data[0].expertId).toBe(expertUserId);
  });

  it('submits quotation via expert endpoint', async () => {
    const res = await request(app)
      .put(`${API_PREFIX}/experts/me/quotations`)
      .set('Cookie', `sid=${expertToken}`)
      .send({ jobId, laborAmount: 5000, materialsAmount: 1000, scope: 'Fix it' })
      .expect(201);
    expect(res.body.data.jobId).toBe(jobId);
    expect(res.body.data.laborAmount).toBe('5000');
  });

  it('lists quotations for job', async () => {
    const res = await request(app)
      .get(`${API_PREFIX}/jobs/${jobId}/quotations`)
      .set('Cookie', `sid=${customerToken}`)
      .expect(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].expertName).toBe('Expert');
  });

  it('includes quotations in job view', async () => {
    const res = await request(app)
      .get(`${API_PREFIX}/jobs/${jobId}`)
      .set('Cookie', `sid=${customerToken}`)
      .expect(200);
    expect(res.body.data.quotations).toHaveLength(1);
  });
});
