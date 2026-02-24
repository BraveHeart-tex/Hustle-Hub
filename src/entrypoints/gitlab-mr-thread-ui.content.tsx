import '@/assets/tailwind.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { ThreadList } from '@/components/mr-thread-ui/ThreadList';
import { defineContentScript } from '#imports';

export default defineContentScript({
  matches: ['*://*.gitlab.com/*/-/merge_requests/*'],
  cssInjectionMode: 'ui',
  async main(ctx) {
    console.log('running content script for thread ui');

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
            <ThreadList container={container} userId={gitlabUserId} />
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
