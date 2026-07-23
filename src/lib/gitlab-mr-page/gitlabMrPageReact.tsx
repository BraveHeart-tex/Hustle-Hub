import { createContext, useContext, useSyncExternalStore } from 'react';

import type {
  GitLabMrPage,
  GitLabMrPageSnapshot,
} from '@/lib/gitlab-mr-page/gitlabMrPage.types';

const GitLabMrPageContext = createContext<GitLabMrPage | null>(null);

export const GitLabMrPageProvider = GitLabMrPageContext.Provider;

export function useGitLabMrPage(): GitLabMrPage {
  const page = useContext(GitLabMrPageContext);
  if (!page) {
    throw new Error('GitLabMrPageProvider is required');
  }

  return page;
}

export function useGitLabMrPageSnapshot(): GitLabMrPageSnapshot {
  const page = useGitLabMrPage();
  return useSyncExternalStore(page.subscribe, page.getSnapshot);
}
