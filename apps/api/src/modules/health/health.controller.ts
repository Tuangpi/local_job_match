import type { Request, Response } from 'express';
import { ok } from '../../common/http.js';
import { getHealthStatus } from './health.service.js';

/** HTTP layer for the health module. */
export function healthController(_req: Request, res: Response): void {
  ok(res, getHealthStatus());
}
