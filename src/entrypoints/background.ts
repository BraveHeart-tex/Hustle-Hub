import { onMessage } from '@/messaging';

export default defineBackground(() => {
  onMessage('getBookmarks', async () => {
    return await browser.bookmarks.getTree();
  });
  onMessage('openBookmark', async (message) => {
    await browser.tabs.create({ url: message.data });
  });
  onMessage('authorizeGitlab', async () => {
    const authUrl = new URL('https://gitlab.com/oauth/authorize');
    authUrl.search = new URLSearchParams({
      client_id: import.meta.env.VITE_GITLAB_CLIENT_ID,
      redirect_uri: import.meta.env.VITE_GITLAB_REDIRECT_URI,
      response_type: 'code',
      scope: 'read_api read_user read_repository',
      state: crypto.randomUUID(),
    }).toString();

    await browser.tabs.create({ url: authUrl.toString() });
  });
});
