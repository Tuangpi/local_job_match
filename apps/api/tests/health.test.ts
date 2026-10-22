import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp, API_PREFIX } from '../src/app.js';

const app = createApp();

describe('GET /api/v1/health', () => {
  it('returns the health status in the success envelope', async () => {
    const response = await request(app).get(`${API_PREFIX}/health`).expect(200);

    expect(response.body).toMatchObject({
      data: {
        status: 'ok',
        service: 'ljm-api',
      },
    });
    expect(response.body.data.timestamp).toBeTypeOf('string');
  });

  it('sets a request id header', async () => {
    const response = await request(app).get(`${API_PREFIX}/health`).expect(200);

    expect(response.headers['x-request-id']).toBeTypeOf('string');
  });
});

describe('unknown routes', () => {
  it('returns the standard error envelope', async () => {
    const response = await request(app).get(`${API_PREFIX}/does-not-exist`).expect(404);

    expect(response.body).toEqual({
      error: {
        code: 'NOT_FOUND',
        message: 'Route GET /api/v1/does-not-exist not found.',
      },
    });
  });
});
