import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

import { prisma } from '../../lib/prisma.js';
import { env } from '../../config/env.js';
import { unauthenticated, validationError, rateLimited } from '../../common/errors.js';
import { logger } from '../../common/logger.js';

const OTP_TTL_MS = 10 * 60 * 1000;
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;

const requestBuckets = new Map<string, number[]>();

function hashValue(value: string): string {
  return createHash('sha256')
    .update(value + env.authSessionSecret)
    .digest('hex');
}

function generateOtp(): string {
  // Six numeric digits, zero-padded.
  const n = randomBytes(4).readUInt32BE(0) % 1_000_000;
  return n.toString().padStart(6, '0');
}

function checkRateLimit(key: string, limit: number, windowMs: number): void {
  const now = Date.now();
  const entries = (requestBuckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (entries.length >= limit) {
    throw rateLimited('Too many requests. Please try again later.');
  }
  entries.push(now);
  requestBuckets.set(key, entries);
}

export async function requestOtp(phone: string, ip: string): Promise<void> {
  checkRateLimit(`phone:${phone}`, 5, 10 * 60 * 1000);
  checkRateLimit(`ip:${ip}`, 20, 10 * 60 * 1000);

  const code = generateOtp();
  const codeHash = hashValue(code);

  await prisma.otpChallenge.create({
    data: {
      phone,
      codeHash,
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    },
  });

  // In production the code is delivered by the OTP provider. Never log it.
  if (env.nodeEnv !== 'production') {
    logger.info('otp issued (development only)', { phone, code });
  }
}

export interface AuthenticatedUser {
  id: string;
  phone: string;
  name: string;
  preferredLanguage: string;
  status: string;
  roles: string[];
}

export async function verifyOtp(
  phone: string,
  code: string,
): Promise<{
  user: AuthenticatedUser;
  sessionToken: string;
}> {
  const challenge = await prisma.otpChallenge.findFirst({
    where: { phone, consumedAt: null },
    orderBy: { createdAt: 'desc' },
  });

  if (!challenge || challenge.expiresAt.getTime() < Date.now()) {
    throw validationError('Invalid or expired verification code.');
  }
  if (challenge.attempts >= OTP_MAX_ATTEMPTS) {
    throw rateLimited('Too many verification attempts.');
  }

  const expected = Buffer.from(challenge.codeHash, 'hex');
  const actual = Buffer.from(hashValue(code), 'hex');
  const match = expected.length === actual.length && timingSafeEqual(expected, actual);

  await prisma.otpChallenge.update({
    where: { id: challenge.id },
    data: { attempts: { increment: 1 } },
  });

  if (!match) {
    throw validationError('Invalid or expired verification code.');
  }

  await prisma.otpChallenge.update({
    where: { id: challenge.id },
    data: { consumedAt: new Date() },
  });

  let user = await prisma.user.findUnique({ where: { phone } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        phone,
        name: phone,
        status: 'active',
        roles: ['customer'],
      },
    });
  } else if (user.status === 'suspended' || user.status === 'deleted') {
    throw unauthenticated('Account is not available.');
  } else if (user.status !== 'active') {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { status: 'active' },
    });
  }

  const sessionToken = randomBytes(32).toString('base64url');
  await prisma.session.create({
    data: {
      userId: user.id,
      tokenHash: hashValue(sessionToken),
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    },
  });

  return {
    user: {
      id: user.id,
      phone: user.phone,
      name: user.name,
      preferredLanguage: user.preferredLanguage,
      status: user.status,
      roles: user.roles,
    },
    sessionToken,
  };
}

export async function getSessionUser(token: string): Promise<AuthenticatedUser | null> {
  const session = await prisma.session.findUnique({
    where: { tokenHash: hashValue(token) },
    include: { user: true },
  });

  if (!session || session.expiresAt.getTime() < Date.now()) {
    if (session) {
      await prisma.session.delete({ where: { id: session.id } }).catch(() => undefined);
    }
    return null;
  }

  const user = session.user;
  if (user.status !== 'active') return null;

  return {
    id: user.id,
    phone: user.phone,
    name: user.name,
    preferredLanguage: user.preferredLanguage,
    status: user.status,
    roles: user.roles,
  };
}

export async function logout(token: string): Promise<void> {
  await prisma.session.deleteMany({ where: { tokenHash: hashValue(token) } });
}

export function sessionCookieOptions(): {
  httpOnly: boolean;
  sameSite: 'lax';
  secure: boolean;
  path: string;
  maxAge: number;
} {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.isProduction,
    path: '/',
    maxAge: SESSION_TTL_MS,
  };
}
