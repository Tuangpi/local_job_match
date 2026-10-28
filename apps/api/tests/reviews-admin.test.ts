import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import crypto from 'node:crypto';

import { createApp, API_PREFIX } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { hashValue } from './helpers.js';

const app = createApp();

describe('reviews and admin', () => {
  let customerUserId: string;
  let customerToken: string;
  let expertUserId: string;
  let expertToken: string;
  let adminUserId: string;
  let adminToken: string;
  let categoryId: string;
  let townshipId: string;
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
    await prisma.expertProfile.create({ data: { userId: expertUserId, verificationStatus: 'verified' } });

    const admin = await prisma.user.create({ data: { phone: `+959${Date.now()}${Math.floor(Math.random()*1000000)}3`, name: 'Admin', status: 'active', roles: ['admin'] } });
    adminUserId = admin.id;
    adminToken = crypto.randomBytes(32).toString('base64url');
    await prisma.session.create({ data: { userId: adminUserId, tokenHash: hashValue(adminToken), expiresAt: new Date(Date.now() + 60 * 60 * 1000) } });

    const category = await prisma.category.findFirst({ where: { isActive: true } });
    const township = await prisma.township.findFirst();
    if (!category || !township) throw new Error('seed missing');
    categoryId = category.id;
    townshipId = township.id;

    const jobRes = await request(app).post(`${API_PREFIX}/jobs`).set('Cookie', `sid=${customerToken}`).send({
      categoryId, townshipId, jobType: 'one_day', title: 'Job', description: 'Desc',
    }).expect(201);
    const jobId = jobRes.body.data.id;

    const qRes = await request(app).put(`${API_PREFIX}/experts/me/quotations`).set('Cookie', `sid=${expertToken}`).send({
      jobId, laborAmount: 5000, materialsAmount: 1000, scope: 'Fix it',
    }).expect(201);
    const quotationId = qRes.body.data.id;

    const acceptRes = await request(app).post(`${API_PREFIX}/quotations/${quotationId}/accept`).set('Cookie', `sid=${customerToken}`).expect(200);
    bookingId = acceptRes.body.data.id;
  });

  afterAll(async () => {
    await prisma.jobStatusHistory.deleteMany({ where: { booking: { id: bookingId } } });
    await prisma.review.deleteMany({ where: { bookingId } });
    await prisma.report.deleteMany({ where: { bookingId } });
    await prisma.booking.deleteMany({ where: { id: bookingId } });
    await prisma.quotation.deleteMany({ where: { job: { customerId: customerUserId } } });
    await prisma.jobInvitation.deleteMany({ where: { job: { customerId: customerUserId } } });
    await prisma.jobPhoto.deleteMany({ where: { job: { customerId: customerUserId } } });
    await prisma.jobRequest.deleteMany({ where: { customerId: customerUserId } });
    await prisma.expertProfile.deleteMany({ where: { userId: expertUserId } });
    await prisma.adminAuditLog.deleteMany({ where: { adminId: adminUserId } });
    await prisma.session.deleteMany({ where: { userId: { in: [customerUserId, expertUserId, adminUserId] } } });
    await prisma.user.deleteMany({ where: { id: { in: [customerUserId, expertUserId, adminUserId] } } });
    await prisma.$disconnect();
  });

  it('blocks review before completion', async () => {
    await request(app).post(`${API_PREFIX}/bookings/${bookingId}/reviews`).set('Cookie', `sid=${customerToken}`).send({ rating: 5 }).expect(422);
  });

  it('allows review after completion', async () => {
    await request(app).post(`${API_PREFIX}/bookings/${bookingId}/status`).set('Cookie', `sid=${customerToken}`).send({ status: 'completed' }).expect(200);
    const res = await request(app).post(`${API_PREFIX}/bookings/${bookingId}/reviews`).set('Cookie', `sid=${customerToken}`).send({ rating: 5, comment: 'Great' }).expect(201);
    expect(res.body.data.rating).toBe(5);
  });

  it('rejects duplicate review', async () => {
    await request(app).post(`${API_PREFIX}/bookings/${bookingId}/reviews`).set('Cookie', `sid=${customerToken}`).send({ rating: 4 }).expect(409);
  });

  it('non-admin cannot use admin endpoints', async () => {
    await request(app).get(`${API_PREFIX}/admin/reports`).set('Cookie', `sid=${customerToken}`).expect(403);
    await request(app).get(`${API_PREFIX}/admin/audit-logs`).set('Cookie', `sid=${customerToken}`).expect(403);
  });

  it('verification and suspension create audit records', async () => {
    const pendingExpert = await prisma.user.create({ data: { phone: `+959${Date.now()}${Math.floor(Math.random()*1000000)}9`, name: 'Pending Expert', status: 'active', roles: ['expert'] } });
    await prisma.expertProfile.create({ data: { userId: pendingExpert.id, verificationStatus: 'pending' } });

    await request(app)
      .post(`${API_PREFIX}/admin/experts/${pendingExpert.id}/verification-decision`)
      .set('Cookie', `sid=${adminToken}`)
      .send({ verified: true })
      .expect(200);

    await request(app)
      .patch(`${API_PREFIX}/admin/users/${customerUserId}/status`)
      .set('Cookie', `sid=${adminToken}`)
      .send({ status: 'suspended' })
      .expect(200);

    const logsRes = await request(app).get(`${API_PREFIX}/admin/audit-logs`).set('Cookie', `sid=${adminToken}`).expect(200);
    const actions = logsRes.body.data.items.map((i: any) => i.action);
    expect(actions).toContain('expert.verification.decision');
    expect(actions).toContain('user.status.update');

    // restore customer status
    await prisma.user.update({ where: { id: customerUserId }, data: { status: 'active' } });
    await prisma.expertProfile.deleteMany({ where: { userId: pendingExpert.id } });
    await prisma.user.delete({ where: { id: pendingExpert.id } });
  });
});
