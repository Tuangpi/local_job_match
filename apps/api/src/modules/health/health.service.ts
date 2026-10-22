import { env } from '../../config/env.js';

export interface HealthStatus {
  status: 'ok';
  service: 'ljm-api';
  version: string;
  environment: string;
  timestamp: string;
}

/** Business logic for the health module. */
export function getHealthStatus(): HealthStatus {
  return {
    status: 'ok',
    service: 'ljm-api',
    version: env.nodeEnv === 'production' ? '1.0.0' : '0.1.0-dev',
    environment: env.nodeEnv,
    timestamp: new Date().toISOString(),
  };
}
