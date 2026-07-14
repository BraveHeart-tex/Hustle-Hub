import { useEffect, useState } from 'react';

import {
  GITLAB_CATEGORIES,
  type GitlabCategory,
  JIRA_FILTERS,
  type JiraFilter,
} from '@/lib/constants';

export const jiraFilterStorage = storage.defineItem<JiraFilter>(
  'local:jiraFilter',
  {
    fallback: JIRA_FILTERS.LITERALLY_WORKING_ON,
  },
);

export const gitlabCategoryStorage = storage.defineItem<GitlabCategory>(
  'local:gitlabCategory',
  {
    fallback: GITLAB_CATEGORIES.REVIEW_REQUESTED,
  },
);

export const useJiraFilter = (initialFilter?: JiraFilter) => {
  const [filter, setFilter] = useState<JiraFilter>(
    initialFilter ||
      jiraFilterStorage.fallback ||
      JIRA_FILTERS.LITERALLY_WORKING_ON,
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

export const useGitlabCategory = (initialCategory?: GitlabCategory) => {
  const [category, setCategory] = useState<GitlabCategory>(
    initialCategory ||
      gitlabCategoryStorage.fallback ||
      GITLAB_CATEGORIES.REVIEW_REQUESTED,
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
