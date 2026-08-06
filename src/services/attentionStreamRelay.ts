import { onMessage } from '@/lib/messaging';
import type { AttentionStreamHandlers } from '@/services/attentionStream';

export function subscribeToAttentionStream(
  handlers: Omit<AttentionStreamHandlers, 'onHeartbeat'>,
): () => void {
  const unsubscribers = [
    onMessage('attentionSnapshot', ({ data }) => handlers.onSnapshot?.(data)),
    onMessage('attentionUpserted', ({ data }) => handlers.onUpserted?.(data)),
    onMessage('attentionResolved', ({ data }) => handlers.onResolved?.(data)),
  ];

  return () => {
    for (const unsubscribe of unsubscribers) {
      unsubscribe();
    }
  };
}
