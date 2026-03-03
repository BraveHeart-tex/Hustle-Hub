import { dispatchUrlChange } from '@/lib/events/url-change';

export default defineContentScript({
  matches: ['*://*.gitlab.com/*'],
  world: 'MAIN',
  runAt: 'document_start',
  main() {
    const patchHistoryMethod = (method: 'pushState' | 'replaceState') => {
      const original = history[method];
      history[method] = function (...args: Parameters<typeof original>) {
        original.apply(history, args);
        dispatchUrlChange();
      };
    };

    patchHistoryMethod('pushState');
    patchHistoryMethod('replaceState');
    window.addEventListener('popstate', dispatchUrlChange);
  },
});
