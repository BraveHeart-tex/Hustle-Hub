import { useQuery, UseQueryResult } from '@tanstack/react-query';

import { ApiResponse } from '@/types/api';

export function useApi<T, K extends readonly unknown[]>(
  queryKey: K,
  fetcher: () => Promise<ApiResponse<T>>,
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
    retry: false,
  });

  const error = query.error;

  return {
    ...query,
    isUnauthorized: error?.type === 'UNAUTHORIZED',
    isError: !!error && error.type !== 'UNAUTHORIZED',
  };
}
