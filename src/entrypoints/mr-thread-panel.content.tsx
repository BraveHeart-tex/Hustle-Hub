import { createRoot } from 'react-dom/client';
import { createShadowRootUi } from 'wxt/utils/content-script-ui/shadow-root';

import { MrThreadApp } from '@/components/mr-thread-panel/MrThreadApp';
import { GITLAB_HIGHLIGHTED_THREAD_CLASS } from '@/lib/constants';
import { createGitLabMrDomHost } from '@/lib/gitlab-mr-page/gitlabMrDomHost';
import { createGitLabMrPage } from '@/lib/gitlab-mr-page/gitlabMrPage';
import { GitLabMrPageProvider } from '@/lib/gitlab-mr-page/gitlabMrPageReact';
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

    const page = createGitLabMrPage(createGitLabMrDomHost());
    ctx.onInvalidated(() => page.dispose());

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

        root.render(
          <GitLabMrPageProvider value={page}>
            <MrThreadApp container={container} gitlabUserId={gitlabUserId} />
          </GitLabMrPageProvider>,
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
