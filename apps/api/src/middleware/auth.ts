import type { NextFunction, Request, Response } from 'express';

import { unauthenticated } from '../common/errors.js';

import { getSessionUser } from '../modules/auth/auth.service.js';

declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      id: string;
      phone: string;
      name: string;
      preferredLanguage: string;
      status: string;
      roles: string[];
    } | null;
  }
}

export function parseCookies(header: string | undefined): Record<string, string> {
  const result: Record<string, string> = {};
  if (!header) return result;
  for (const part of header.split(';')) {
    const [rawKey, ...rest] = part.trim().split('=');
    if (!rawKey) continue;
    const key = rawKey.trim();
    const value = rest.join('=').trim();
    if (key) {
      try {
        result[key] = decodeURIComponent(value);
      } catch {
        result[key] = value;
      }
    }
  }
  return result;
}

export async function authContext(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies.sid;
  if (!token) {
    req.user = null;
    next();
    return;
  }
  try {
    req.user = await getSessionUser(token);
  } catch {
    req.user = null;
  }
  next();
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) {
    next(unauthenticated());
    return;
  }
  next();
}
