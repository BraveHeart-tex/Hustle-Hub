import { defineExtensionMessaging } from '@webext-core/messaging';

import type { AttentionItem } from '@/types/attention';

export interface LaunchClaudeData {
  slug: string;
  prompt: string;
  permissionMode: 'plan' | 'default';
  jiraId?: string;
}

export interface LaunchClaudeResponse {
  ok: boolean;
  error?: string;
  sessionName?: string;
}

interface ProtocolMap {
  launchClaude(data: LaunchClaudeData): LaunchClaudeResponse;
  attentionSnapshot(items: AttentionItem[]): void;
  attentionUpserted(item: AttentionItem): void;
  attentionResolved(item: AttentionItem): void;
}

export const { sendMessage, onMessage } =
  defineExtensionMessaging<ProtocolMap>();
