import { parseHTML } from 'linkedom';

import {
  type GitLabMrHost,
  type GitLabMrNavigationListener,
} from '@/lib/gitlab-mr-page/gitlabMrHost';

interface ControlledMutationObserver {
  callback: MutationCallback;
  disconnected: boolean;
}

export interface ScrollRequest {
  element: Element;
  options?: ScrollIntoViewOptions;
}

export interface GitLabMrFixtureHost extends GitLabMrHost {
  emitMutation(records?: MutationRecord[]): void;
  emitNavigation(): void;
  replaceDocument(html: string): void;
  setHref(href: string): void;
  scrollRequests: ScrollRequest[];
}

interface CreateGitLabMrFixtureHostOptions {
  href: string;
  html: string;
}

export function createGitLabMrFixtureHost({
  href,
  html,
}: CreateGitLabMrFixtureHostOptions): GitLabMrFixtureHost {
  let currentHref = href;
  let nextHref = href;
  let currentDocument = parseDocument(html);
  const navigationListeners = new Set<GitLabMrNavigationListener>();
  const mutationObservers: ControlledMutationObserver[] = [];
  const scrollRequests: ScrollRequest[] = [];

  return {
    getDocument: () => currentDocument,
    getHref: () => currentHref,
    observeMutations: (_target, _options, callback) => {
      const observer = { callback, disconnected: false };
      mutationObservers.push(observer);

      return {
        disconnect: () => {
          observer.disconnected = true;
        },
      };
    },
    onNavigation: (listener) => {
      navigationListeners.add(listener);
      return () => navigationListeners.delete(listener);
    },
    scrollIntoView: (element, options) => {
      scrollRequests.push({ element, options });
    },
    emitMutation: (records = []) => {
      for (const observer of mutationObservers) {
        if (!observer.disconnected) {
          observer.callback(records, {} as MutationObserver);
        }
      }
    },
    emitNavigation: () => {
      currentHref = nextHref;
      for (const listener of navigationListeners) {
        listener();
      }
    },
    replaceDocument: (nextHtml) => {
      currentDocument = parseDocument(nextHtml);
    },
    setHref: (next) => {
      nextHref = next;
    },
    scrollRequests,
  };
}

function parseDocument(html: string): Document {
  return parseHTML(html).document as unknown as Document;
}
