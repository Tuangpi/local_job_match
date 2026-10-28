import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import crypto from 'node:crypto';

import { createApp, API_PREFIX } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { hashValue } from './helpers.js';

const app = createApp();

describe('quotations and concurrency', () => {
  let customerUserId: string;
  let customerToken: string;
  let otherCustomerUserId: string;
  let otherCustomerToken: string;
  let expertUserId: string;
  let expertToken: string;
  let categoryId: string;
  let townshipId: string;
  let openJobId: string;
  let expiredQuotationId: string;

  beforeAll(async () => {
    const customer = await prisma.user.create({ data: { phone: `+959${Date.now()}${Math.floor(Math.random()*1000000)}1`, name: 'Customer', status: 'active', roles: ['customer'] } });
    customerUserId = customer.id;
    customerToken = crypto.randomBytes(32).toString('base64url');
    await prisma.session.create({ data: { userId: customerUserId, tokenHash: hashValue(customerToken), expiresAt: new Date(Date.now() + 60 * 60 * 1000) } });

    const otherCustomer = await prisma.user.create({ data: { phone: `+959${Date.now()}${Math.floor(Math.random()*1000000)}2`, name: 'Other Customer', status: 'active', roles: ['customer'] } });
    otherCustomerUserId = otherCustomer.id;
    otherCustomerToken = crypto.randomBytes(32).toString('base64url');
    await prisma.session.create({ data: { userId: otherCustomerUserId, tokenHash: hashValue(otherCustomerToken), expiresAt: new Date(Date.now() + 60 * 60 * 1000) } });

    const expert = await prisma.user.create({ data: { phone: `+959${Date.now()}${Math.floor(Math.random()*1000000)}3`, name: 'Expert', status: 'active', roles: ['expert'] } });
    expertUserId = expert.id;
    expertToken = crypto.randomBytes(32).toString('base64url');
    await prisma.session.create({ data: { userId: expertUserId, tokenHash: hashValue(expertToken), expiresAt: new Date(Date.now() + 60 * 60 * 1000) } });
    await prisma.expertProfile.create({ data: { userId: expertUserId, verificationStatus: 'verified' } });

    const category = await prisma.category.findFirst({ where: { isActive: true } });
    const township = await prisma.township.findFirst();
    if (!category || !township) throw new Error('seed missing');
    categoryId = category.id;
    townshipId = township.id;

    const jobRes = await request(app).post(`${API_PREFIX}/jobs`).set('Cookie', `sid=${customerToken}`).send({
      categoryId, townshipId, jobType: 'one_day', title: 'Job', description: 'Desc',
    });
    openJobId = jobRes.body.data.id;

    const expiredJobRes = await request(app).post(`${API_PREFIX}/jobs`).set('Cookie', `sid=${customerToken}`).send({
      categoryId, townshipId, jobType: 'one_day', title: 'Expired Job', description: 'Desc',
    });
    const expiredJobId = expiredJobRes.body.data.id;
    const past = new Date(Date.now() - 60 * 1000).toISOString();
    const qRes = await request(app).put(`${API_PREFIX}/experts/me/quotations`).set('Cookie', `sid=${expertToken}`).send({
      jobId: expiredJobId, laborAmount: 1000, materialsAmount: 0, scope: 'Fix', validUntil: past,
    });
    expiredQuotationId = qRes.body.data.id;
  });

  afterAll(async () => {
    await prisma.jobStatusHistory.deleteMany({ where: { booking: { job: { customerId: customerUserId } } } });
    await prisma.booking.deleteMany({ where: { job: { customerId: customerUserId } } });
    await prisma.quotation.deleteMany({ where: { job: { customerId: customerUserId } } });
    await prisma.jobInvitation.deleteMany({ where: { job: { customerId: customerUserId } } });
    await prisma.jobPhoto.deleteMany({ where: { job: { customerId: customerUserId } } });
    await prisma.jobRequest.deleteMany({ where: { customerId: customerUserId } });
    await prisma.expertProfile.deleteMany({ where: { userId: expertUserId } });
    await prisma.session.deleteMany({ where: { userId: { in: [customerUserId, otherCustomerUserId, expertUserId] } } });
    await prisma.user.deleteMany({ where: { id: { in: [customerUserId, otherCustomerUserId, expertUserId] } } });
    await prisma.$disconnect();
  });

  it('rejects quote on closed job', async () => {
    await prisma.jobRequest.update({ where: { id: openJobId }, data: { status: 'completed' } });
    await request(app)
      .put(`${API_PREFIX}/experts/me/quotations`)
      .set('Cookie', `sid=${expertToken}`)
      .send({ jobId: openJobId, laborAmount: 1000, materialsAmount: 0, scope: 'Fix' })
      .expect(422);
    await prisma.jobRequest.update({ where: { id: openJobId }, data: { status: 'open' } });
  });

  it('rejects acceptance by non-owner customer', async () => {
    const qRes = await request(app).put(`${API_PREFIX}/experts/me/quotations`).set('Cookie', `sid=${expertToken}`).send({
      jobId: openJobId, laborAmount: 2000, materialsAmount: 0, scope: 'Fix',
    }).expect(201);
    const quotationId = qRes.body.data.id;
    await request(app).post(`${API_PREFIX}/quotations/${quotationId}/accept`).set('Cookie', `sid=${otherCustomerToken}`).expect(403);
  });

  it('rejects expired quotation acceptance', async () => {
    await request(app).post(`${API_PREFIX}/quotations/${expiredQuotationId}/accept`).set('Cookie', `sid=${customerToken}`).expect(422);
  });

  it('rejects price validation failure', async () => {
    await request(app)
      .put(`${API_PREFIX}/experts/me/quotations`)
      .set('Cookie', `sid=${expertToken}`)
      .send({ jobId: openJobId, laborAmount: -1, materialsAmount: 0, scope: 'Fix' })
      .expect(400);
  });

  it('concurrent acceptance yields at most one booking', async () => {
    const qRes = await request(app).put(`${API_PREFIX}/experts/me/quotations`).set('Cookie', `sid=${expertToken}`).send({
      jobId: openJobId, laborAmount: 3000, materialsAmount: 0, scope: 'Fix',
    }).expect(201);
    const quotationId = qRes.body.data.id;

    const [r1, r2] = await Promise.all([
      request(app).post(`${API_PREFIX}/quotations/${quotationId}/accept`).set('Cookie', `sid=${customerToken}`),
      request(app).post(`${API_PREFIX}/quotations/${quotationId}/accept`).set('Cookie', `sid=${customerToken}`),
    ]);

    const successCount = [r1.status, r2.status].filter((s) => s === 200).length;
    expect(successCount).toBeLessThanOrEqual(1);
    const bookings = await prisma.booking.findMany({ where: { jobId: openJobId } });
    expect(bookings.length).toBeLessThanOrEqual(1);
  });
});
