import { onMessage } from '@/messaging';

export default defineBackground(() => {
  browser.commands.onCommand.addListener(async (command) => {
    console.log('command', command);
    if (command === 'toggle-overlay') {
      const [tab] = await browser.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (!tab?.id) return;

      console.log('tab', tab);

      await browser.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content-scripts/content.js'],
      });
    }
  });

  onMessage('geetBookmarks', async () => {
    return await browser.bookmarks.getTree();
  });
});
