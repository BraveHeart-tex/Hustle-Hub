import { onMessage, sendMessage } from '@/messaging';
import { OAuthStatus } from '@/types/auth';

export default defineBackground(() => {
  onMessage('getBookmarks', async () => {
    return await browser.bookmarks.getTree();
  });
  onMessage('openBookmark', async (message) => {
    await browser.tabs.create({ url: message.data });
  });
  onMessage('authorizeGitlab', async () => {
    const extensionRedirect = `https://${browser.runtime.id}.chromiumapp.org/gitlab-callback`;
    const backendOAuthUrl = new URL(import.meta.env.VITE_GITLAB_REDIRECT_URI);
    backendOAuthUrl.search = new URLSearchParams({
      client_redirect_uri: extensionRedirect,
      state: crypto.randomUUID(),
    }).toString();

    browser.identity.launchWebAuthFlow(
      {
        url: backendOAuthUrl.toString(),
        interactive: true,
      },
      async (redirectUrl) => {
        if (browser.runtime.lastError) {
          console.error(browser.runtime.lastError);
          return;
        }

        const params = new URLSearchParams(new URL(redirectUrl!).search);
        const status: OAuthStatus =
          (params.get('status') as OAuthStatus) || 'error';

        sendMessage('gitlabOAuthCallback', {
          status,
        });
      },
    );
  });
  onMessage('goHome', async () => {
    const newTabEntryName = 'newtab';
    const newTabUrl = browser.runtime.getURL(`/${newTabEntryName}.html`);

    const existingTabs = await browser.tabs.query({ url: newTabUrl });

    if (existingTabs && existingTabs.length > 0) {
      browser.tabs.update(existingTabs[0].id, { active: true });
    } else {
      browser.tabs.create({ url: newTabUrl });
    }
  });
});
