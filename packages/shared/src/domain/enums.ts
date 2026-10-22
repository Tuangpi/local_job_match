/**
 * Domain enums mirroring the PostgreSQL enum types in docs/DATABASE.md.
 * Keep these values in sync with the database schema.
 */

export const ACCOUNT_STATUSES = ['active', 'suspended', 'pending', 'deleted'] as const;
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

export const VERIFICATION_STATUSES = ['unverified', 'pending', 'verified', 'rejected'] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

export const JOB_TYPES = ['one_day', 'installation', 'project'] as const;
export type JobType = (typeof JOB_TYPES)[number];

export const JOB_STATUSES = [
  'draft',
  'open',
  'in_progress',
  'completed',
  'cancelled',
  'disputed',
] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export const QUOTATION_STATUSES = [
  'pending',
  'accepted',
  'rejected',
  'withdrawn',
  'expired',
] as const;
export type QuotationStatus = (typeof QUOTATION_STATUSES)[number];

/** User roles. A single account may act as both customer and expert. */
export const USER_ROLES = ['customer', 'expert', 'admin'] as const;
export type UserRole = (typeof USER_ROLES)[number];

/** Supported UI languages. Burmese is the default. */
export const LANGUAGES = ['my', 'en'] as const;
export type Language = (typeof LANGUAGES)[number];

export const DEFAULT_LANGUAGE: Language = 'my';

/** Currency codes. MMK is the default. */
export const CURRENCIES = ['MMK'] as const;
export type Currency = (typeof CURRENCIES)[number];

export const DEFAULT_CURRENCY: Currency = 'MMK';
