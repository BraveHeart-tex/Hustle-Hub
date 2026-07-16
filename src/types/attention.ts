import type { components, paths } from '@/generated/openapi';

export type AttentionItem = components['schemas']['AttentionItem'];
export type AttentionPriority = AttentionItem['priority'];
export type AttentionSource = AttentionItem['source'];
export type SnoozeDuration =
  paths['/api/attention/{id}/snooze']['patch']['requestBody']['content']['application/json']['duration'];
