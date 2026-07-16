import createClient from 'openapi-fetch';

import type { paths } from '@/generated/openapi';
import type { ApiErrorEnvelope, ApiErrorType } from '@/types/api';

const MAX_READ_ATTEMPTS = 3;
const RETRY_DELAYS = [500, 1_000] as const;

const configuredApiBaseUrl = import.meta.env.VITE_BASE_API_URL.replace(
  /\/$/,
  '',
);
const apiBaseUrl = configuredApiBaseUrl.endsWith('/api')
  ? configuredApiBaseUrl.slice(0, -4)
  : configuredApiBaseUrl;

export const apiClient = createClient<paths>({
  baseUrl: apiBaseUrl,
  fetch: async (request) => {
    try {
      return await fetch(request);
    } catch (error) {
      if (isAbortError(error)) throw error;
      throw new ApiError(
        'NETWORK',
        'Could not connect to the API.',
        undefined,
        {
          cause: error,
        },
      );
    }
  },
});

export type ClientErrorType = ApiErrorType | 'NETWORK' | 'UNEXPECTED';

export class ApiError extends Error {
  constructor(
    public readonly type: ClientErrorType,
    message: string,
    public readonly status?: number,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = 'ApiError';
  }
}

interface ApiResult<T> {
  data?: { success: true; data: T };
  error?: ApiErrorEnvelope;
  response: Response;
}

export async function executeRead<T>(
  request: () => Promise<ApiResult<T>>,
  signal?: AbortSignal,
): Promise<T> {
  for (let attempt = 0; attempt < MAX_READ_ATTEMPTS; attempt += 1) {
    try {
      return await executeRequest(request);
    } catch (error) {
      if (isAbortError(error)) throw error;

      const apiError = toApiError(error);
      const shouldRetry =
        attempt < MAX_READ_ATTEMPTS - 1 && isRetryable(apiError);

      if (!shouldRetry) throw apiError;
      await waitForRetry(RETRY_DELAYS[attempt], signal);
    }
  }

  throw new ApiError('UNEXPECTED', 'The API request did not complete.');
}

export async function executeMutation<T>(
  request: () => Promise<ApiResult<T>>,
): Promise<T> {
  try {
    return await executeRequest(request);
  } catch (error) {
    if (isAbortError(error)) throw error;
    throw toApiError(error);
  }
}

export function getApiUrl(path: keyof paths): string {
  return new URL(path, `${apiBaseUrl}/`).toString();
}

async function executeRequest<T>(
  request: () => Promise<ApiResult<T>>,
): Promise<T> {
  const { data, error, response } = await request();

  if (data) return data.data;

  if (error) {
    throw new ApiError(error.error.type, error.error.message, response.status);
  }

  throw new ApiError(
    'UNEXPECTED',
    `Unexpected API response with status ${response.status}.`,
    response.status,
  );
}

function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  return new ApiError(
    'UNEXPECTED',
    'The API returned an unexpected response.',
    undefined,
    { cause: error },
  );
}

function isRetryable(error: ApiError): boolean {
  return (
    error.type === 'NETWORK' ||
    (error.status !== undefined && error.status >= 500)
  );
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

function waitForRetry(delay: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason ?? new DOMException('Aborted', 'AbortError'));
      return;
    }

    const onAbort = () => {
      clearTimeout(timeoutId);
      reject(signal?.reason ?? new DOMException('Aborted', 'AbortError'));
    };
    const timeoutId = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, delay);

    signal?.addEventListener('abort', onAbort, { once: true });
  });
}
