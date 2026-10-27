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

describe('quotation acceptance', () => {
  let customerUserId: string;
  let customerToken: string;
  let expertUserId: string;
  let expertToken: string;
  let categoryId: string;
  let townshipId: string;
  let jobId: string;
  let quotationId: string;

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

    const qRes = await request(app).put(`${API_PREFIX}/experts/me/quotations`).set('Cookie', `sid=${expertToken}`).send({
      jobId, laborAmount: 5000, materialsAmount: 1000, scope: 'Fix it',
    });
    quotationId = qRes.body.data.id;
  });

  afterAll(async () => {
    await prisma.jobStatusHistory.deleteMany({ where: { booking: { jobId } } });
    await prisma.booking.deleteMany({ where: { jobId } });
    await prisma.quotation.deleteMany({ where: { jobId } });
    await prisma.jobInvitation.deleteMany({ where: { jobId } });
    await prisma.jobPhoto.deleteMany({ where: { jobId } });
    await prisma.jobRequest.deleteMany({ where: { id: jobId } });
    await prisma.expertProfile.deleteMany({ where: { userId: expertUserId } });
    await prisma.session.deleteMany({ where: { userId: { in: [customerUserId, expertUserId] } } });
    await prisma.user.deleteMany({ where: { id: { in: [customerUserId, expertUserId] } } });
    await prisma.$disconnect();
  });

  it('accepts quotation via POST', async () => {
    const res = await request(app)
      .post(`${API_PREFIX}/quotations/${quotationId}/accept`)
      .set('Cookie', `sid=${customerToken}`)
      .expect(200);
    expect(res.body.data.status).toBe('in_progress');
    expect(res.body.data.agreedAmount).toBe('6000');

    const job = await prisma.jobRequest.findUnique({ where: { id: jobId } });
    expect(job?.status).toBe('in_progress');
  });

  it('rejects second acceptance (concurrency)', async () => {
    // create another quotation? reuse expired; just call accept again
    await request(app)
      .post(`${API_PREFIX}/quotations/${quotationId}/accept`)
      .set('Cookie', `sid=${customerToken}`)
      .expect(409);
  });

  it('rejects invalid uuid', async () => {
    await request(app)
      .post(`${API_PREFIX}/quotations/not-a-uuid/accept`)
      .set('Cookie', `sid=${customerToken}`)
      .expect(400);
  });
});