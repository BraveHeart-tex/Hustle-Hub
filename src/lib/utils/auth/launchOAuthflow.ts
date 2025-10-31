import { OAuthCallbackKey, sendMessage } from '@/messaging';
import { OAuthProvider, OAuthStatus } from '@/types/auth';

export const launchOAuthFlow = async ({
  backendRedirectUri,
  callbackMessage,
  provider,
}: {
  provider: OAuthProvider;
  backendRedirectUri: string;
  callbackMessage: OAuthCallbackKey;
}) => {
  const extensionRedirect = browser.identity.getRedirectURL(
    `${provider}-callback`,
  );
  const backendOAuthUrl = new URL(backendRedirectUri);

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
      if (!redirectUrl) return;

      const params = new URLSearchParams(new URL(redirectUrl).search);
      const status: OAuthStatus =
        (params.get('status') as OAuthStatus) || 'error';

      sendMessage(callbackMessage, { status });
    },
  );
};
