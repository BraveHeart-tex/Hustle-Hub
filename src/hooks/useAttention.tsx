// ============================================================
// ATTENTION ENGINE - DATA HOOK
//
// Combines the SSE stream with an initial fetch so the cache
// is populated immediately, then kept live by push events.
// ============================================================
import { useApi } from '@/hooks/useApi';
import { useAttentionStream } from '@/hooks/useAttentionStream';
import { QUERY_KEYS } from '@/lib/constants';
import { ENDPOINTS } from '@/lib/endpoints';
import { getMockAttentionItems, isMockDataEnabled } from '@/lib/mockData';
import { type AttentionItem } from '@/types/attention';

export function useAttention() {
  // Open SSE stream — syncs cache in background
  useAttentionStream();

  // Initial fetch seeds the cache before first SSE snapshot arrives.
  // After that, SSE takes over and this query becomes stale-while-revalidate.
  return useApi(QUERY_KEYS.attention.list, async () => {
    if (isMockDataEnabled) {
      return { success: true, data: getMockAttentionItems() };
    }

    const response = await fetch(ENDPOINTS.attention.list);
    const json = (await response.json().catch(() => ({}))) as {
      items?: AttentionItem[];
      message?: string;
    };

    if (!response.ok || !Array.isArray(json.items)) {
      return {
        success: false,
        error: {
          type: 'INTERNAL' as const,
          message: json.message ?? 'Failed to load attention feed.',
        },
      };
    }

    return {
      success: true,
      data: json.items,
    };
  });
}
