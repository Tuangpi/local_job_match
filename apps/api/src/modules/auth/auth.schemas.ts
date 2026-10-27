import { z } from 'zod';

export const otpRequestSchema = z.object({
  phone: z
    .string()
    .trim()
    .min(8)
    .max(20)
    .regex(/^\+?[0-9]+$/, 'Invalid phone number.'),
});

export const otpVerifySchema = z.object({
  phone: z
    .string()
    .trim()
    .min(8)
    .max(20)
    .regex(/^\+?[0-9]+$/, 'Invalid phone number.'),
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Code must be 6 digits.'),
});

export type OtpRequestInput = z.infer<typeof otpRequestSchema>;
export type OtpVerifyInput = z.infer<typeof otpVerifySchema>;
