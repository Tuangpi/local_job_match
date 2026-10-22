import { API_ERROR_CODES, type ApiErrorCode } from '@ljm/shared';

/**
 * Application error carrying an HTTP status and a stable machine-readable
 * code (docs/API.md section 7). Thrown by services and controllers; the
 * error handler turns it into the standard error envelope.
 */
export class AppError extends Error {
  readonly statusCode: number;
  readonly code: ApiErrorCode;
  readonly details: unknown;

  constructor(statusCode: number, code: ApiErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace?.(this, AppError);
  }
}

export const badRequest = (message: string, details?: unknown): AppError =>
  new AppError(400, API_ERROR_CODES.BAD_REQUEST, message, details);

export const validationError = (message: string, details?: unknown): AppError =>
  new AppError(400, API_ERROR_CODES.VALIDATION_ERROR, message, details);

export const unauthenticated = (message = 'Authentication is required.'): AppError =>
  new AppError(401, API_ERROR_CODES.UNAUTHENTICATED, message);

export const forbidden = (message = 'You do not have access to this resource.'): AppError =>
  new AppError(403, API_ERROR_CODES.FORBIDDEN, message);

export const notFound = (message = 'Resource not found.'): AppError =>
  new AppError(404, API_ERROR_CODES.NOT_FOUND, message);

export const conflict = (message: string, details?: unknown): AppError =>
  new AppError(409, API_ERROR_CODES.CONFLICT, message, details);

export const businessRuleViolation = (message: string, details?: unknown): AppError =>
  new AppError(422, API_ERROR_CODES.BUSINESS_RULE_VIOLATION, message, details);

export const rateLimited = (message = 'Too many requests.'): AppError =>
  new AppError(429, API_ERROR_CODES.RATE_LIMITED, message);

export const internalError = (message = 'An unexpected error occurred.'): AppError =>
  new AppError(500, API_ERROR_CODES.INTERNAL_ERROR, message);
