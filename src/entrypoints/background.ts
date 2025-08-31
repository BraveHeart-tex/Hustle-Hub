import { onMessage } from '@/messaging';

export default defineBackground(() => {
  onMessage('getBookmarks', async () => {
    return await browser.bookmarks.getTree();
  });
  onMessage('openBookmark', async (message) => {
    await browser.tabs.create({ url: message.data });
  });
});
