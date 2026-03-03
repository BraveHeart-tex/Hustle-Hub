import { createRoot } from 'react-dom/client';

import { MrThreadApp } from '@/components/mr-thread-panel/MrThreadApp';
import { GITLAB_HIGHLIGHTED_THREAD_CLASS } from '@/lib/constants';
import { defineContentScript } from '#imports';

export default defineContentScript({
  matches: ['*://*.gitlab.com/*/-/merge_requests/*'],
  excludeMatches: [
    '*://*.gitlab.com/*/-/merge_requests/*/new',
    '*://*.gitlab.com/*/-/merge_requests/*/edit',
  ],
  cssInjectionMode: 'ui',
  async main(ctx) {
    document.styleSheets[0].insertRule(
      `.${GITLAB_HIGHLIGHTED_THREAD_CLASS} {
        transition: box-shadow 0.3s ease, transform 0.3s ease !important;
        box-shadow: 0 0 0 3px #1f75cb !important;
        border-radius: 8px !important;
      }`,
      0,
    );

    const mrTitle =
      document.querySelector("[data-testid='title-content']")?.textContent ||
      '';
    const jiraId = mrTitle.match(/([A-Z][A-Z0-9]+-\d+)/)?.[1];

    const gitlabUserId = import.meta.env.VITE_GITLAB_USER_ID;
    if (!gitlabUserId) {
      console.warn('No VITE_GITLAB_USER_ID found in .env');
    }

    const ui = await createShadowRootUi(ctx, {
      name: 'gitlab-mr-threads-popover-ui',
      position: 'inline',
      anchor: 'body',
      append: 'last',
      onMount: (container) => {
        const app = document.createElement('div');

        container.append(app);

        const root = createRoot(app);

        let lastUrl = location.href;
        const observer = new MutationObserver(() => {
          const url = location.href;
          if (url !== lastUrl) {
            lastUrl = url;
            window.dispatchEvent(new Event('url-change'));
          }
        });

        observer.observe(document, { subtree: true, childList: true });

        ctx.onInvalidated(() => observer.disconnect());

        root.render(
          <MrThreadApp
            container={container}
            gitlabUserId={gitlabUserId}
            jiraId={jiraId}
          />,
        );

        return root;
      },
      onRemove: (root) => {
        root?.unmount();
      },
    });

    ui.mount();
  },
  runAt: 'document_end',
});
