import { launchOAuthFlow } from '@/lib/utils/auth/launchOAuthflow';
import { onMessage } from '@/messaging';

export default defineBackground(() => {
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
  onMessage('authorizeGitlab', async () => {
    launchOAuthFlow({
      backendRedirectUri: import.meta.env.VITE_GITLAB_REDIRECT_URI,
      callbackMessage: 'gitlabOAuthCallback',
      provider: 'gitlab',
    });
  });
  onMessage('authorizeGoogleCalendar', async () => {
    launchOAuthFlow({
      backendRedirectUri: import.meta.env.VITE_GOOGLE_CALENDAR_REDIRECT_URI,
      callbackMessage: 'googleCalendarOAuthCallback',
      provider: 'googleCalendar',
    });
  });
});
