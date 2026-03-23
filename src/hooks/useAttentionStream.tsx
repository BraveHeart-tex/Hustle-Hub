import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { QUERY_KEYS } from '@/lib/constants';
import type { AttentionItem } from '@/types/attention';

type AttentionMessage =
  | { type: 'attention:snapshot'; items: AttentionItem[] }
  | { type: 'attention:upserted'; item: AttentionItem }
  | { type: 'attention:resolved'; item: AttentionItem };

export function useAttentionStream(): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    const handler = (message: AttentionMessage) => {
      if (message.type === 'attention:snapshot') {
        queryClient.setQueryData(QUERY_KEYS.attention.list, message.items);
        return;
      }

      if (message.type === 'attention:upserted') {
        const { item } = message;
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
        return;
      }

      if (message.type === 'attention:resolved') {
        queryClient.setQueryData<AttentionItem[]>(
          QUERY_KEYS.attention.list,
          (prev = []) => prev.filter((i) => i.id !== message.item.id),
        );
      }
    };

    browser.runtime.onMessage.addListener(handler);
    return () => browser.runtime.onMessage.removeListener(handler);
  }, [queryClient]);
}

const PRIORITY_ORDER = { critical: 0, warning: 1, info: 2 } as const;

function byPriority(a: AttentionItem, b: AttentionItem): number {
  return (PRIORITY_ORDER[a.priority] ?? 2) - (PRIORITY_ORDER[b.priority] ?? 2);
}
