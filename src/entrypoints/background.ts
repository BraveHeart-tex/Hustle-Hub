import { browser } from 'wxt/browser';
import { defineBackground } from 'wxt/utils/define-background';

import {
  queueNotification,
  shouldNotify,
} from '@/lib/attention/notificationManager';
import {
  type LaunchClaudeData,
  type LaunchClaudeResponse,
  onMessage,
} from '@/lib/messaging';
import { connectAttentionStream } from '@/services/attentionStream';
import { type AttentionItem } from '@/types/attention';

const NATIVE_HOST_NAME = 'com.borakaraca.claude_launcher';

const launchClaude = async (
  data: LaunchClaudeData,
): Promise<LaunchClaudeResponse> => {
  try {
    // The webextension-polyfill promisifies sendNativeMessage and only accepts
    // (application, message). Passing a callback throws "Expected at most 2
    // arguments", so we must await the returned promise instead.
    const response: LaunchClaudeResponse | undefined =
      await browser.runtime.sendNativeMessage(NATIVE_HOST_NAME, {
        type: 'claude.launch',
        ...data,
      });

    if (!response?.ok) {
      console.error('[launchClaude] native host error:', response?.error);
    }

    return (
      response ?? {
        ok: false,
        error: 'Native launcher returned no response',
      }
    );
  } catch (error) {
    console.error('[launchClaude] sendNativeMessage threw:', error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Native messaging failed',
    };
  }
};

const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === 'true';

function notify(batch: AttentionItem[]): void {
  if (batch.length === 1) {
    const item = batch[0];
    browser.notifications.create(item.id, {
      type: 'basic',
      iconUrl: browser.runtime.getURL('/icon-128.png'),
      title: item.title,
      message: item.entityTitle ?? item.body ?? '',
      silent: false,
    });
  } else {
    browser.notifications.create('attention:batch:' + Date.now(), {
      type: 'basic',
      iconUrl: browser.runtime.getURL('/icon-128.png'),
      title: `${batch.length} items need your attention`,
      message: batch.map((i) => i.title).join('\n'),
      silent: false,
    });
  }
}

export default defineBackground({
  persistent: true,
  main() {
    onMessage('launchClaude', ({ data }) => launchClaude(data));

    browser.runtime.onStartup.addListener(() => {
      console.warn(
        'listening for browser start to prevent inactive service worker',
      );
    });

    setInterval(() => {
      browser.runtime.getPlatformInfo().catch(() => {});
    }, 20_000);

    if (!USE_MOCK_DATA) {
      try {
        connectAttentionStream({
          onUpserted(item) {
            if (shouldNotify(item)) queueNotification(item, notify);
          },
        });
      } catch (error) {
        console.error('Failed to connect attention stream.', error);
      }
    }

    // Click notification → open new tab
    browser.notifications.onClicked.addListener(() => {
      // notificationId is the item id for single notifications
      browser.tabs
        .query({ url: browser.runtime.getURL('/newtab.html') })
        .then((tabs) => {
          if (tabs.length > 0 && tabs[0].id) {
            browser.tabs.update(tabs[0].id, { active: true });
          } else {
            browser.tabs.create({
              url: browser.runtime.getURL('/newtab.html'),
            });
          }
        });
    });
  },
});
