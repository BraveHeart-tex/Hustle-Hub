import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { OAuthCallbackKey, sendMessage } from '@/messaging';
import { OAuthProvider, OAuthStatus } from '@/types/auth';
import { BookmarkNode, FlatBookmark } from '@/types/bookmarks';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function flattenBookmarks(nodes: BookmarkNode[]): FlatBookmark[] {
  let result: FlatBookmark[] = [];
  for (const node of nodes) {
    if (node.url) result.push(node as FlatBookmark);
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

export const formatGitLabLabel = (label: string): string => {
  return label
    .replace(/::/g, ': ')
    .split(/[:\s]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const getForegroundColor = (bgColor: string): string => {
  const hex = bgColor.replace('#', '');

  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.5 ? 'black' : 'white';
};

export const darkenHexColor = (hex: string, factor: number = 0.2): string => {
  if (!/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(hex)) {
    throw new Error('Invalid hex color format');
  }

  if (hex.length === 4) {
    hex = '#' + [...hex.slice(1)].map((c) => c + c).join('');
  }

  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  const darken = (channel: number) =>
    Math.max(0, Math.min(255, Math.round(channel * (1 - factor))));

  const dr = darken(r);
  const dg = darken(g);
  const db = darken(b);

  const toHex = (v: number) => v.toString(16).padStart(2, '0');

  return `#${toHex(dr)}${toHex(dg)}${toHex(db)}`;
};

export const extractJiraId = (str: string): string | null => {
  const match = str.match(/[A-Z]+-\d+/);
  return match ? match[0] : null;
};

export const waitForElement = <T extends Element>(
  selector: string,
  timeout = 5000,
): Promise<T> => {
  return new Promise((resolve, reject) => {
    const element = document.querySelector(selector);
    if (element) return resolve(element as T);

    const observer = new MutationObserver(() => {
      const el = document.querySelector(selector);
      if (el) {
        observer.disconnect();
        resolve(el as T);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Timeout: ${selector} not found`));
    }, timeout);
  });
};

export const waitForLabel = (
  labelText: string,
  timeout = 5000,
): Promise<HTMLElement> => {
  return new Promise((resolve, reject) => {
    const observer = new MutationObserver(() => {
      const labels = document.querySelectorAll('[data-testid="labels-list"]');
      for (const label of labels) {
        let span = label.querySelector('span');
        if (span?.hasAttribute('data-testid')) {
          const sibling = span.nextElementSibling as HTMLElement;
          if (sibling && sibling.tagName === 'SPAN') {
            span = sibling;
          }
        }

        if (span && span.textContent.trim() === labelText) {
          observer.disconnect();
          resolve(label as HTMLElement);
          return;
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Timeout: Label "${labelText}" not found`));
    }, timeout);
  });
};

export const safeKeys = <T extends object>(obj: T): Array<keyof T> => {
  return Object.keys(obj) as Array<keyof T>;
};

const timeFormatter = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
});

export const formatEventStartAndEnd = (
  start?: string,
  end?: string,
): string => {
  return start && end
    ? `${timeFormatter.format(new Date(start))} – ${timeFormatter.format(
        new Date(end),
      )}`
    : 'All day';
};
