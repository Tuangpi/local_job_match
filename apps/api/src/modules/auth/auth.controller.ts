import type { Request, Response } from 'express';
import { ok } from '../../common/http.js';
import { asyncHandler } from '../../common/async-handler.js';
import { requestOtp, verifyOtp, logout, sessionCookieOptions } from './auth.service.js';
import { otpRequestSchema, otpVerifySchema } from './auth.schemas.js';
import { parseCookies } from '../../middleware/auth.js';

export const requestOtpController = asyncHandler(async (req: Request, res: Response) => {
  const input = otpRequestSchema.parse(req.body);
  await requestOtp(input.phone, req.ip ?? 'unknown');
  ok(res, { message: 'Verification code sent if the number is eligible.' });
});

export const verifyOtpController = asyncHandler(async (req: Request, res: Response) => {
  const input = otpVerifySchema.parse(req.body);
  const result = await verifyOtp(input.phone, input.code);
  res.cookie('sid', result.sessionToken, sessionCookieOptions());
  ok(res, { user: result.user });
});

export const logoutController = asyncHandler(async (req: Request, res: Response) => {
  const token = parseCookies(req.headers.cookie).sid;
  if (typeof token === 'string' && token.length > 0) {
    await logout(token);
  }
  res.clearCookie('sid', { path: '/' });
  ok(res, { message: 'Logged out.' });
});
