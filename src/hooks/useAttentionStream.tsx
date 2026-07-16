import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { QUERY_KEYS } from '@/lib/constants';
import { isMockDataEnabled } from '@/lib/mockData';
import { connectAttentionStream } from '@/services/attentionStream';
import type { AttentionItem, AttentionSource } from '@/types/attention';

export function useAttentionStream(): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (isMockDataEnabled) return;

    return connectAttentionStream({
      onSnapshot(items) {
        queryClient.setQueryData(QUERY_KEYS.attention.list, items);
        refreshRelatedQueries(queryClient, [
          ...new Set(items.map((item) => item.source)),
        ]);
      },
      onUpserted(item) {
        queryClient.setQueryData<AttentionItem[]>(
          QUERY_KEYS.attention.list,
          (prev = []) => {
            if (item.status === 'snoozed' || item.status === 'dismissed') {
              return prev.filter((i) => i.id !== item.id);
            }
            const idx = prev.findIndex((i) => i.id === item.id);
            if (idx !== -1) {
              const next = [...prev];
              next[idx] = item;
              return next;
            }
            return [...prev, item].sort(byPriority);
          },
        );
        refreshRelatedQueries(queryClient, [item.source]);
      },
      onResolved(resolved) {
        queryClient.setQueryData<AttentionItem[]>(
          QUERY_KEYS.attention.list,
          (prev = []) => prev.filter((i) => i.id !== resolved.id),
        );
        refreshRelatedQueries(queryClient, [resolved.source]);
      },
    });
  }, [queryClient]);
}

const PRIORITY_ORDER = { critical: 0, warning: 1, info: 2 } as const;

function byPriority(a: AttentionItem, b: AttentionItem): number {
  return (PRIORITY_ORDER[a.priority] ?? 2) - (PRIORITY_ORDER[b.priority] ?? 2);
}

function refreshRelatedQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  sources: AttentionSource[],
): void {
  for (const source of sources) {
    if (source === 'gitlab') {
      void queryClient.invalidateQueries({ queryKey: ['gitlab'] });
    }

    if (source === 'jira') {
      void queryClient.invalidateQueries({ queryKey: ['jira'] });
    }
  }
}
