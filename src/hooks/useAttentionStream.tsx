import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

import { QUERY_KEYS } from '@/lib/constants';
import { ENDPOINTS } from '@/lib/endpoints';
import type { AttentionItem, AttentionSource } from '@/types/attention';

const RECONNECT_DELAY = 3_000;

export function useAttentionStream(): void {
  const queryClient = useQueryClient();
  const esRef = useRef<EventSource | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let unmounted = false;

    function connect() {
      if (unmounted) return;
      const es = new EventSource(ENDPOINTS.attention.stream);
      esRef.current = es;

      es.addEventListener('snapshot', (e: MessageEvent) => {
        const items = JSON.parse(e.data) as AttentionItem[];
        queryClient.setQueryData(QUERY_KEYS.attention.list, items);
        refreshRelatedQueries(queryClient, [
          ...new Set(items.map((item) => item.source)),
        ]);
      });

      es.addEventListener('upserted', (e: MessageEvent) => {
        const item = JSON.parse(e.data) as AttentionItem;
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
      });

      es.addEventListener('resolved', (e: MessageEvent) => {
        const resolved = JSON.parse(e.data) as AttentionItem;
        queryClient.setQueryData<AttentionItem[]>(
          QUERY_KEYS.attention.list,
          (prev = []) => prev.filter((i) => i.id !== resolved.id),
        );
        refreshRelatedQueries(queryClient, [resolved.source]);
      });

      es.addEventListener('heartbeat', () => {});

      es.addEventListener('error', () => {
        es.close();
        esRef.current = null;
        if (!unmounted) {
          reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY);
        }
      });
    }

    connect();

    return () => {
      unmounted = true;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      esRef.current?.close();
      esRef.current = null;
    };
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
