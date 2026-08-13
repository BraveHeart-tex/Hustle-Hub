import { useEffect, useState } from 'react';
import { storage } from 'wxt/utils/storage';

import {
  GITLAB_CATEGORIES,
  type GitlabCategory,
  JIRA_FILTERS,
  type JiraFilter,
} from '@/lib/constants';

const jiraFilterStorage = storage.defineItem<JiraFilter>('local:jiraFilter', {
  fallback: JIRA_FILTERS.LITERALLY_WORKING_ON,
});

const gitlabCategoryStorage = storage.defineItem<GitlabCategory>(
  'local:gitlabCategory',
  {
    fallback: GITLAB_CATEGORIES.REVIEW_REQUESTED,
  },
);

export const useJiraFilter = () => {
  const [filter, setFilter] = useState<JiraFilter>(
    jiraFilterStorage.fallback || JIRA_FILTERS.LITERALLY_WORKING_ON,
  );

  useEffect(() => {
    jiraFilterStorage.getValue().then(setFilter);
    return jiraFilterStorage.watch(setFilter);
  }, []);

  const updateFilter = (newFilter: JiraFilter) => {
    setFilter(newFilter);
    jiraFilterStorage.setValue(newFilter);
  };

  return [filter, updateFilter] as const;
};

export const useGitlabCategory = () => {
  const [category, setCategory] = useState<GitlabCategory>(
    gitlabCategoryStorage.fallback || GITLAB_CATEGORIES.REVIEW_REQUESTED,
  );

  useEffect(() => {
    gitlabCategoryStorage.getValue().then(setCategory);
    return gitlabCategoryStorage.watch(setCategory);
  }, []);

  const updateCategory = (newCategory: GitlabCategory) => {
    setCategory(newCategory);
    gitlabCategoryStorage.setValue(newCategory);
  };

  return [category, updateCategory] as const;
};

const gitlabGroupOpenStateStorage = storage.defineItem<Record<string, boolean>>(
  'local:gitlabGroupOpenState',
  { fallback: {} },
);

export const useGitlabGroupOpenState = () => {
  const [openState, setOpenState] = useState<Record<string, boolean>>(
    gitlabGroupOpenStateStorage.fallback || {},
  );

  useEffect(() => {
    gitlabGroupOpenStateStorage.getValue().then(setOpenState);
    return gitlabGroupOpenStateStorage.watch(setOpenState);
  }, []);

  const setGroupOpen = (groupLabel: string, isOpen: boolean) => {
    setOpenState((currentState) => {
      const nextState = { ...currentState, [groupLabel]: isOpen };
      gitlabGroupOpenStateStorage.setValue(nextState);
      return nextState;
    });
  };

  return [openState, setGroupOpen] as const;
};
