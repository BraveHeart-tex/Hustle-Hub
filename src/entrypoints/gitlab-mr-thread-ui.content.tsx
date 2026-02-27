import '@/assets/tailwind.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { BottomRightPanel } from '@/components/mr-thread-ui/BottomRightPanel';
import { JiraQuickLink } from '@/components/mr-thread-ui/JiraQuickLink';
import { ThreadList } from '@/components/mr-thread-ui/ThreadList';
import { GITLAB_HIGHLIGHTED_THREAD_CLASS } from '@/lib/constants';
import { defineContentScript } from '#imports';

export default defineContentScript({
  matches: ['*://*.gitlab.com/*/-/merge_requests/*'],
  excludeMatches: ['*://*.gitlab.com/*/-/merge_requests/*/new'],
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

    const gitlabUserId = import.meta.env.VITE_GITLAB_USER_ID;
    if (!gitlabUserId) {
      console.error('Please provide VITE_GITLAB_USER_ID in .env');
      return;
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
        root.render(
          <StrictMode>
            <BottomRightPanel className="flex items-center gap-2">
              <JiraQuickLink mrTitle={mrTitle} />
              <ThreadList container={container} userId={gitlabUserId} />
            </BottomRightPanel>
          </StrictMode>,
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
