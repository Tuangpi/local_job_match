import { config as loadDotenv } from 'dotenv';
import { z } from 'zod';

loadDotenv();

/**
 * Environment configuration.
 *
 * `DATABASE_URL` and `AUTH_SESSION_SECRET` are optional for now so the API
 * can boot for local development before Prisma and session auth land.
 * TODO(Task 2): make DATABASE_URL required once Prisma is wired in.
 * TODO(Task 3): make AUTH_SESSION_SECRET required once sessions are used.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.coerce.number().int().positive().default(4000),
  WEB_ORIGIN: z.string().default('http://localhost:5173'),
  DATABASE_URL: z.string().optional(),
  AUTH_SESSION_SECRET: z.string().optional(),
  OTP_PROVIDER_API_KEY: z.string().optional(),
  UPLOAD_DIR: z.string().default('./storage/uploads'),
  MAX_UPLOAD_SIZE_MB: z.coerce.number().int().positive().default(8),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('\n');
  throw new Error(`Invalid environment configuration:\n${issues}`);
}

export const env = {
  nodeEnv: parsed.data.NODE_ENV,
  isProduction: parsed.data.NODE_ENV === 'production',
  isTest: parsed.data.NODE_ENV === 'test',
  apiPort: parsed.data.API_PORT,
  webOrigin: parsed.data.WEB_ORIGIN,
  databaseUrl: parsed.data.DATABASE_URL,
  authSessionSecret: parsed.data.AUTH_SESSION_SECRET,
  otpProviderApiKey: parsed.data.OTP_PROVIDER_API_KEY,
  uploadDir: parsed.data.UPLOAD_DIR,
  maxUploadSizeMb: parsed.data.MAX_UPLOAD_SIZE_MB,
} as const;

export type Env = typeof env;
