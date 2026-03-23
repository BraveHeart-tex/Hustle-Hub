import {
  queueNotification,
  shouldNotify,
} from '@/lib/attention/notificationManager';
import { type AttentionItem } from '@/types/attention';

const API_BASE = import.meta.env.VITE_BASE_API_URL as string;
const RECONNECT_DELAY = 3_000;

function broadcastToTabs(message: unknown): void {
  const newtabUrl = browser.runtime.getURL('/newtab.html');
  browser.tabs.query({ url: `${newtabUrl}*` }).then((tabs) => {
    for (const tab of tabs) {
      if (tab.id) {
        browser.tabs.sendMessage(tab.id, message).catch(() => {});
      }
    }
  });
}

function notify(batch: AttentionItem[]): void {
  if (batch.length === 1) {
    const item = batch[0];
    browser.notifications.create(item.id, {
      type: 'basic',
      iconUrl: browser.runtime.getURL('/icon-128.png'),
      title: item.title,
      message: item.entityTitle ?? item.body ?? '',
    });
  } else {
    browser.notifications.create('attention:batch:' + Date.now(), {
      type: 'basic',
      iconUrl: browser.runtime.getURL('/icon-128.png'),
      title: `${batch.length} items need your attention`,
      message: batch.map((i) => i.title).join('\n'),
    });
  }
}

function connectSSE(): void {
  const es = new EventSource(`${API_BASE}/attention/stream`);

  es.addEventListener('snapshot', (e: MessageEvent) => {
    const items = JSON.parse(e.data) as AttentionItem[];
    broadcastToTabs({ type: 'attention:snapshot', items });
  });

  es.addEventListener('upserted', (e: MessageEvent) => {
    const item = JSON.parse(e.data) as AttentionItem;
    broadcastToTabs({ type: 'attention:upserted', item });

    if (shouldNotify(item)) {
      queueNotification(item, notify);
    }
  });

  es.addEventListener('resolved', (e: MessageEvent) => {
    const item = JSON.parse(e.data) as AttentionItem;
    broadcastToTabs({ type: 'attention:resolved', item });
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
    const keepAlive = () => {
      setInterval(() => {
        browser.runtime.getPlatformInfo().catch(() => {});
      }, 20_000);
    };

    keepAlive();
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
