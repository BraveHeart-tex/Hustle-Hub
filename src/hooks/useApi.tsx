import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { type ApiResponse } from '@/types/api';

interface UseApiOptions {
  enabled?: boolean;
}

export function useApi<T, K extends readonly unknown[]>(
  queryKey: K,
  fetcher: () => Promise<ApiResponse<T>>,
  options: UseApiOptions = {},
) {
  const query: UseQueryResult<
    T,
    { type: 'UNAUTHORIZED' | 'INTERNAL'; message: string }
  > = useQuery({
    queryKey,
    queryFn: async () => {
      const response = await fetcher();

      if (response.success) return response.data;

      throw response.error;
    },
    enabled: options.enabled,
    retry: false,
  });

  const error = query.error;

  return {
    ...query,
    isUnauthorized: error?.type === 'UNAUTHORIZED',
    isError: !!error && error.type !== 'UNAUTHORIZED',
  };
}
