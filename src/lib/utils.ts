import { OAuthCallbackKey, sendMessage } from '@/messaging';
import { OAuthProvider, OAuthStatus } from '@/types/auth';
import { BookmarkNode, FlatBookmark } from '@/types/bookmarks';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function flattenBookmarks(nodes: BookmarkNode[]): FlatBookmark[] {
  let result: any[] = [];
  for (const node of nodes) {
    if (node.url) result.push(node);
    if (node.children) result = result.concat(flattenBookmarks(node.children));
  }
  return result;
}

export function getJiraTaskUrl(issueKey: string): string {
  return `https://letgotr.atlassian.net/browse/${issueKey}`;
}

const defaultDateFormatOptions: Intl.DateTimeFormatOptions = {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
};

export function formatDate(
  dateInput: string | number | Date,
  options: Intl.DateTimeFormatOptions = {},
): string {
  const date = new Date(dateInput);

  return new Intl.DateTimeFormat('en-GB', {
    ...defaultDateFormatOptions,
    ...options,
  })
    .format(date)
    .replace(',', ''); // remove comma for cleaner output
}

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
