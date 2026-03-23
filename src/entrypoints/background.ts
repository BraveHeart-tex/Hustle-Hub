import {
  queueNotification,
  shouldNotify,
} from '@/lib/attention/notificationManager';
import { type AttentionItem } from '@/types/attention';

const API_BASE = import.meta.env.VITE_BASE_API_URL as string;
const RECONNECT_DELAY = 3_000;

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

function connectSSE(): void {
  const es = new EventSource(`${API_BASE}/attention/stream`);

  es.addEventListener('upserted', (e: MessageEvent) => {
    const item = JSON.parse(e.data) as AttentionItem;
    if (shouldNotify(item)) {
      queueNotification(item, notify);
    }
  });

  es.addEventListener('heartbeat', () => {});

  es.addEventListener('error', () => {
    es.close();
    setTimeout(connectSSE, RECONNECT_DELAY);
  });
}

export default defineBackground({
  persistent: true,
  main() {
    browser.runtime.onStartup.addListener(() => {
      console.warn(
        'listening for browser start to prevent inactive service worker',
      );
    });

    setInterval(() => {
      browser.runtime.getPlatformInfo().catch(() => {});
    }, 20_000);

    // SSE connection for attention feed
    connectSSE();

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
