import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import crypto from 'node:crypto';

import { createApp, API_PREFIX } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { hashValue } from './helpers.js';

const app = createApp();

describe('customer/expert journey', () => {
  let customerUserId: string;
  let customerToken: string;
  let expertUserId: string;
  let expertToken: string;
  let categoryId: string;
  let townshipId: string;
  let jobId: string;
  let bookingId: string;

  beforeAll(async () => {
    const customer = await prisma.user.create({ data: { phone: `+959${Date.now()}${Math.floor(Math.random()*1000000)}1`, name: 'Customer', status: 'active', roles: ['customer'] } });
    customerUserId = customer.id;
    customerToken = crypto.randomBytes(32).toString('base64url');
    await prisma.session.create({ data: { userId: customerUserId, tokenHash: hashValue(customerToken), expiresAt: new Date(Date.now() + 60 * 60 * 1000) } });

    const expert = await prisma.user.create({ data: { phone: `+959${Date.now()}${Math.floor(Math.random()*1000000)}2`, name: 'Expert', status: 'active', roles: ['expert'] } });
    expertUserId = expert.id;
    expertToken = crypto.randomBytes(32).toString('base64url');
    await prisma.session.create({ data: { userId: expertUserId, tokenHash: hashValue(expertToken), expiresAt: new Date(Date.now() + 60 * 60 * 1000) } });

    const category = await prisma.category.findFirst({ where: { isActive: true } });
    const township = await prisma.township.findFirst();
    if (!category || !township) throw new Error('seed missing');
    categoryId = category.id;
    townshipId = township.id;

    await prisma.expertProfile.create({
      data: { userId: expertUserId, verificationStatus: 'verified', isAvailable: true, skills: { create: [{ categoryId }] }, areas: { create: [{ townshipId }] } },
    });
  });

  afterAll(async () => {
    await prisma.jobStatusHistory.deleteMany({ where: { booking: { job: { customerId: customerUserId } } } });
    await prisma.review.deleteMany({ where: { booking: { job: { customerId: customerUserId } } } });
    await prisma.booking.deleteMany({ where: { job: { customerId: customerUserId } } });
    await prisma.quotation.deleteMany({ where: { job: { customerId: customerUserId } } });
    await prisma.jobInvitation.deleteMany({ where: { job: { customerId: customerUserId } } });
    await prisma.jobPhoto.deleteMany({ where: { job: { customerId: customerUserId } } });
    await prisma.jobRequest.deleteMany({ where: { customerId: customerUserId } });
    await prisma.expertSkill.deleteMany({ where: { expertId: expertUserId } });
    await prisma.expertArea.deleteMany({ where: { expertId: expertUserId } });
    await prisma.expertProfile.deleteMany({ where: { userId: expertUserId } });
    await prisma.session.deleteMany({ where: { userId: { in: [customerUserId, expertUserId] } } });
    await prisma.user.deleteMany({ where: { id: { in: [customerUserId, expertUserId] } } });
    await prisma.$disconnect();
  });

  it('browses experts', async () => {
    const res = await request(app).get(`${API_PREFIX}/experts`).query({ categoryId, townshipId }).expect(200);
    const ids = res.body.data.items.map((i: any) => i.userId);
    expect(ids).toContain(expertUserId);
  });

  it('creates job', async () => {
    const res = await request(app).post(`${API_PREFIX}/jobs`).set('Cookie', `sid=${customerToken}`).send({
      categoryId, townshipId, jobType: 'one_day', title: 'Fix sink', description: 'Leaking',
    }).expect(201);
    jobId = res.body.data.id;
    expect(res.body.data.status).toBe('open');
  });

  it('invites expert and submits quotation', async () => {
    await request(app).post(`${API_PREFIX}/jobs/${jobId}/invitations`).set('Cookie', `sid=${customerToken}`).send({ expertId: expertUserId }).expect(201);
    const qRes = await request(app).put(`${API_PREFIX}/experts/me/quotations`).set('Cookie', `sid=${expertToken}`).send({
      jobId, laborAmount: 4000, materialsAmount: 500, scope: 'Fix sink',
    }).expect(201);
    expect(qRes.body.data.jobId).toBe(jobId);
  });

  it('compares quotations in job view', async () => {
    const res = await request(app).get(`${API_PREFIX}/jobs/${jobId}`).set('Cookie', `sid=${customerToken}`).expect(200);
    expect(res.body.data.quotations).toHaveLength(1);
  });

  it('accepts quotation and creates booking', async () => {
    const jobRes = await request(app).get(`${API_PREFIX}/jobs/${jobId}/quotations`).set('Cookie', `sid=${customerToken}`).expect(200);
    const quotationId = jobRes.body.data[0].id;
    const acceptRes = await request(app).post(`${API_PREFIX}/quotations/${quotationId}/accept`).set('Cookie', `sid=${customerToken}`).expect(200);
    bookingId = acceptRes.body.data.id;
    expect(acceptRes.body.data.status).toBe('in_progress');
  });

  it('completes and reviews', async () => {
    await request(app).post(`${API_PREFIX}/bookings/${bookingId}/status`).set('Cookie', `sid=${customerToken}`).send({ status: 'completed' }).expect(200);
    const reviewRes = await request(app).post(`${API_PREFIX}/bookings/${bookingId}/reviews`).set('Cookie', `sid=${customerToken}`).send({ rating: 5, comment: 'Done well' }).expect(201);
    expect(reviewRes.body.data.rating).toBe(5);
  });
});
