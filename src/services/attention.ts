import { apiClient, executeMutation, executeRead } from '@/services/api/client';
import type { AttentionItem, SnoozeDuration } from '@/types/attention';

export async function fetchAttentionItems(
  signal?: AbortSignal,
): Promise<AttentionItem[]> {
  const data = await executeRead(
    () => apiClient.GET('/api/attention/', { signal }),
    signal,
  );

  return data.items;
}

export function dismissAttentionItem(id: string): Promise<AttentionItem> {
  return executeMutation(() =>
    apiClient.PATCH('/api/attention/{id}/dismiss', {
      params: { path: { id } },
    }),
  );
}

export function snoozeAttentionItem(
  id: string,
  duration: SnoozeDuration,
): Promise<AttentionItem> {
  return executeMutation(() =>
    apiClient.PATCH('/api/attention/{id}/snooze', {
      params: { path: { id } },
      body: { duration },
    }),
  );
}
