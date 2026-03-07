import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

import { QUERY_KEYS } from '@/lib/constants';
import { ENDPOINTS } from '@/lib/endpoints';
import { AttentionItem } from '@/types/attention';

// SSE reconnect delay on unexpected disconnect (ms)
const RECONNECT_DELAY = 3_000;

export function useAttentionStream(): void {
  const queryClient = useQueryClient();
  const esRef = useRef<EventSource | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let unmounted = false;

    function connect() {
      if (unmounted) return;

      const es = new EventSource(ENDPOINTS.ATTENTION_STREAM);
      esRef.current = es;

      // Full snapshot on connect — replaces whatever is in cache
      es.addEventListener('snapshot', (e: MessageEvent) => {
        const items = JSON.parse(e.data) as AttentionItem[];
        queryClient.setQueryData(QUERY_KEYS.ATTENTION, items);
      });

      // Single item upserted (created or updated)
      es.addEventListener('upserted', (e: MessageEvent) => {
        const incoming = JSON.parse(e.data) as AttentionItem;
        queryClient.setQueryData<AttentionItem[]>(
          QUERY_KEYS.ATTENTION,
          (prev = []) => {
            const exists = prev.findIndex((i) => i.id === incoming.id);
            if (exists !== -1) {
              // Update in place, preserve order
              const next = [...prev];
              next[exists] = incoming;
              return next;
            }
            // New item — insert sorted by priority
            return [...prev, incoming].sort(byPriority);
          },
        );
      });

      // Item auto-resolved — remove from cache
      es.addEventListener('resolved', (e: MessageEvent) => {
        const resolved = JSON.parse(e.data) as AttentionItem;
        queryClient.setQueryData<AttentionItem[]>(
          QUERY_KEYS.ATTENTION,
          (prev = []) => prev.filter((i) => i.id !== resolved.id),
        );
      });

      // Heartbeat — no action needed, just keeps connection alive
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

// ------------------------------------------------------------
// Priority sort — critical first, then warning, then info
// ------------------------------------------------------------

const PRIORITY_ORDER = { critical: 0, warning: 1, info: 2 } as const;

function byPriority(a: AttentionItem, b: AttentionItem): number {
  return (PRIORITY_ORDER[a.priority] ?? 2) - (PRIORITY_ORDER[b.priority] ?? 2);
}
