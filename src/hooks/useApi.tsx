import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { type ApiError } from '@/services/api/client';

interface UseApiOptions {
  enabled?: boolean;
}

export function useApi<T, K extends readonly unknown[]>(
  queryKey: K,
  fetcher: (signal: AbortSignal) => Promise<T>,
  options: UseApiOptions = {},
) {
  const query: UseQueryResult<T, ApiError> = useQuery({
    queryKey,
    queryFn: ({ signal }) => fetcher(signal),
    enabled: options.enabled,
    retry: false,
  });

  const error = query.error;

  return {
    ...query,
    isUnauthorized: error?.type === 'UNAUTHORIZED',
    isError: error !== null && error.type !== 'UNAUTHORIZED',
  };
}
