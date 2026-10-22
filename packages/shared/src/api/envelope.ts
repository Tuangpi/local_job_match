/**
 * Response envelope shared by the API and the web client.
 * See docs/API.md section 7.
 */

export interface ApiSuccess<TData> {
  data: TData;
}

export interface ApiFailure {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<TData> = ApiSuccess<TData> | ApiFailure;

export function isApiSuccess<TData>(response: ApiResponse<TData>): response is ApiSuccess<TData> {
  return 'data' in response;
}

export function isApiFailure<TData>(response: ApiResponse<TData>): response is ApiFailure {
  return 'error' in response;
}

/** Cursor pagination contract used by list endpoints (docs/API.md section 1). */
export interface Paginated<TItem> {
  items: TItem[];
  nextCursor: string | null;
  hasMore: boolean;
}

export const DEFAULT_PAGE_LIMIT = 20;
export const MAX_PAGE_LIMIT = 100;
