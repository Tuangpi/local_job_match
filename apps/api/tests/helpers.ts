import crypto from 'node:crypto';

import { prisma } from '../src/lib/prisma.js';
import { env } from '../src/config/env.js';

export function hashValue(value: string): string {
  return crypto.createHash('sha256').update(value + env.authSessionSecret).digest('hex');
}

export async function createActiveUser(
  roles: string[],
  name = 'Test User',
): Promise<{ id: string; phone: string }> {
  const user = await prisma.user.create({
    data: {
      phone: `+959${Date.now()}${Math.floor(Math.random() * 1_000_000)}`,
      name,
      status: 'active',
      roles: roles as any,
    },
  });
  return { id: user.id, phone: user.phone };
}

export async function createSession(userId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString('base64url');
  await prisma.session.create({
    data: {
      userId,
      tokenHash: hashValue(token),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    },
  });
  return token;
}

export function cookie(token: string): string {
  return `sid=${token}`;
}
