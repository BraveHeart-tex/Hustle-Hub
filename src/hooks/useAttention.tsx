// ============================================================
// ATTENTION ENGINE - DATA HOOK
//
// Combines the SSE stream with an initial fetch so the cache
// is populated immediately, then kept live by push events.
// ============================================================
import { useApi } from '@/hooks/useApi';
import { QUERY_KEYS } from '@/lib/constants';
import { ENDPOINTS } from '@/lib/endpoints';
import type { ApiResponse } from '@/types/api';
import { type AttentionItem } from '@/types/attention';

import { useAttentionStream } from './useAttentionStream';

export function useAttention() {
  // Open SSE stream — syncs cache in background
  useAttentionStream();

  // Initial fetch seeds the cache before first SSE snapshot arrives.
  // After that, SSE takes over and this query becomes stale-while-revalidate.
  return useApi(QUERY_KEYS.attention.list, async () => {
    const response = await fetch(ENDPOINTS.attention.list);
    return (await response.json()) as ApiResponse<AttentionItem[]>;
  });
}
