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
