import { defineExtensionMessaging } from '@webext-core/messaging';

export interface LaunchClaudeData {
  slug: string;
  prompt: string;
  permissionMode: 'plan' | 'default';
}

export interface LaunchClaudeResponse {
  ok: boolean;
  error?: string;
  sessionName?: string;
}

interface ProtocolMap {
  launchClaude(data: LaunchClaudeData): LaunchClaudeResponse;
}

export const { sendMessage, onMessage } =
  defineExtensionMessaging<ProtocolMap>();
