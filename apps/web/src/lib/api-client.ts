import { isApiFailure, type ApiResponse } from '@ljm/shared';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';

/** Error thrown when the API returns a non-success response. */
export class ApiClientError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = code;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
}

/**
 * Typed fetch wrapper for the REST API. It unwraps the standard response
 * envelope and raises ApiClientError with the server's error code.
 */
export async function apiRequest<TData>(
  path: string,
  options: RequestOptions = {},
): Promise<TData> {
  const { method = 'GET', body, signal } = options;

  const init: RequestInit = { method, credentials: 'include' };

  if (body !== undefined) {
    init.headers = { 'Content-Type': 'application/json' };
    init.body = JSON.stringify(body);
  }

  if (signal !== undefined) {
    init.signal = signal;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, init);

  let payload: ApiResponse<TData> | null = null;
  try {
    payload = (await response.json()) as ApiResponse<TData>;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    if (payload && isApiFailure<TData>(payload)) {
      throw new ApiClientError(response.status, payload.error.code, payload.error.message);
    }
    throw new ApiClientError(
      response.status,
      'HTTP_ERROR',
      `Request failed with status ${response.status}.`,
    );
  }

  if (!payload) {
    throw new ApiClientError(
      response.status,
      'INVALID_RESPONSE',
      'The API returned an empty response.',
    );
  }

  if (isApiFailure<TData>(payload)) {
    throw new ApiClientError(response.status, payload.error.code, payload.error.message);
  }

  return payload.data;
}

export const apiClient = {
  get: <TData>(path: string, signal?: AbortSignal) =>
    apiRequest<TData>(path, signal === undefined ? {} : { signal }),
  post: <TData>(path: string, body?: unknown) => apiRequest<TData>(path, { method: 'POST', body }),
  patch: <TData>(path: string, body?: unknown) =>
    apiRequest<TData>(path, { method: 'PATCH', body }),
  put: <TData>(path: string, body?: unknown) => apiRequest<TData>(path, { method: 'PUT', body }),
  delete: <TData>(path: string) => apiRequest<TData>(path, { method: 'DELETE' }),
};
