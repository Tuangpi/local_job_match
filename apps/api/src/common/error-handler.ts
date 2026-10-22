import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { API_ERROR_CODES } from '@ljm/shared';
import { AppError } from './errors.js';
import { fail } from './http.js';
import { logger } from './logger.js';

/** 404 handler for unmatched routes. */
export function notFoundHandler(req: Request, res: Response): void {
  fail(res, 404, API_ERROR_CODES.NOT_FOUND, `Route ${req.method} ${req.originalUrl} not found.`);
}

/**
 * Central error handler. Converts known errors into the standard error
 * envelope and never leaks internals for unexpected failures
 * (docs/API.md section 8).
 */
export function errorHandler(
  error: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (error instanceof AppError) {
    fail(res, error.statusCode, error.code, error.message, error.details);
    return;
  }

  if (error instanceof ZodError) {
    fail(res, 400, API_ERROR_CODES.VALIDATION_ERROR, 'Request validation failed.', {
      issues: error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    });
    return;
  }

  logger.error('unhandled error', {
    requestId: req.requestId,
    method: req.method,
    path: req.originalUrl,
    errorName: error instanceof Error ? error.name : 'UnknownError',
    errorMessage: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });

  fail(res, 500, API_ERROR_CODES.INTERNAL_ERROR, 'An unexpected error occurred.');
}
