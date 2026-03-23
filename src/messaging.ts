import { defineExtensionMessaging } from '@webext-core/messaging';

interface ProtocolMap {
  testNotification(): void;
}

export type OAuthCallbackKey = keyof ProtocolMap & `${string}OAuthCallback`;

export const { sendMessage, onMessage } =
  defineExtensionMessaging<ProtocolMap>();
