import { beforeAll, afterAll, describe, it } from 'vitest';
import request from 'supertest';
import crypto from 'node:crypto';

import { createApp, API_PREFIX } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { hashValue } from './helpers.js';

const app = createApp();

describe('auth', () => {
  let userId: string;
  let token: string;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: { phone: `+959${Date.now()}1`, name: 'Auth User', status: 'active', roles: ['customer'] },
    });
    userId = user.id;
    token = crypto.randomBytes(32).toString('base64url');
    await prisma.session.create({
      data: { userId, tokenHash: hashValue(token), expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
    });
  });

  afterAll(async () => {
    await prisma.session.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });
    await prisma.$disconnect();
  });

  it('rejects invalid OTP', async () => {
    const phone = `+959${Date.now()}9`;
    await request(app).post(`${API_PREFIX}/auth/otp/request`).send({ phone }).expect(200);
    await request(app)
      .post(`${API_PREFIX}/auth/otp/verify`)
      .send({ phone, code: '000000' })
      .expect(400);
  });

  it('enforces OTP request limits', async () => {
    const phone = `+959${Date.now()}7`;
    for (let i = 0; i < 5; i += 1) {
      await request(app).post(`${API_PREFIX}/auth/otp/request`).send({ phone }).expect(200);
    }
    await request(app).post(`${API_PREFIX}/auth/otp/request`).send({ phone }).expect(429);
  });

  it('suspended users cannot perform protected actions', async () => {
    const suspended = await prisma.user.create({
      data: { phone: `+959${Date.now()}8`, name: 'Suspended', status: 'suspended', roles: ['customer'] },
    });
    const suspendedToken = crypto.randomBytes(32).toString('base64url');
    await prisma.session.create({
      data: { userId: suspended.id, tokenHash: hashValue(suspendedToken), expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
    });

    await request(app).get(`${API_PREFIX}/users/me`).set('Cookie', `sid=${suspendedToken}`).expect(401);

    await prisma.session.deleteMany({ where: { userId: suspended.id } });
    await prisma.user.delete({ where: { id: suspended.id } });
  });

  it('rejects unauthenticated access', async () => {
    await request(app).get(`${API_PREFIX}/users/me`).expect(401);
  });
});
