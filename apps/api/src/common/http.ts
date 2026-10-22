import type { Response } from 'express';
import type { ApiFailure, ApiSuccess } from '@ljm/shared';

/** Send a successful response in the standard envelope (docs/API.md section 7). */
export function ok<TData>(res: Response, data: TData, statusCode = 200): Response {
  const body: ApiSuccess<TData> = { data };
  return res.status(statusCode).json(body);
}

/** Send a 201 response in the standard envelope. */
export function created<TData>(res: Response, data: TData): Response {
  return ok(res, data, 201);
}

/** Send an error response in the standard envelope (docs/API.md section 7). */
export function fail(
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: unknown,
): Response {
  const body: ApiFailure = { error: { code, message } };
  if (details !== undefined) {
    body.error.details = details;
  }
  return res.status(statusCode).json(body);
}
