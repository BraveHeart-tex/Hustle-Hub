// ============================================================
// ATTENTION ENGINE - DATA HOOK
//
// Combines the SSE stream with an initial fetch so the cache
// is populated immediately, then kept live by push events.
// ============================================================
import { useApi } from '@/hooks/useApi';
import { useAttentionStream } from '@/hooks/useAttentionStream';
import { QUERY_KEYS } from '@/lib/constants';
import { getMockAttentionItems, isMockDataEnabled } from '@/lib/mockData';
import { fetchAttentionItems } from '@/services/attention';

export function useAttention() {
  // Open SSE stream — syncs cache in background
  useAttentionStream();

  // Initial fetch seeds the cache before first SSE snapshot arrives.
  // After that, SSE takes over and this query becomes stale-while-revalidate.
  return useApi(QUERY_KEYS.attention.list, async (signal) => {
    if (isMockDataEnabled) {
      return getMockAttentionItems();
    }

    return fetchAttentionItems(signal);
  });
}
