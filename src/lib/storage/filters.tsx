import { useEffect, useState } from 'react';

import {
  GITLAB_FILTERS,
  type GitlabFilter,
  JIRA_FILTERS,
  type JiraFilter,
} from '@/lib/constants';

export const jiraFilterStorage = storage.defineItem<JiraFilter>(
  'local:jiraFilter',
  {
    fallback: JIRA_FILTERS.LITERALLY_WORKING_ON,
  },
);

export const gitlabFilterStorage = storage.defineItem<GitlabFilter>(
  'local:gitlabFilter',
  {
    fallback: GITLAB_FILTERS.REVIEW,
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

export const useGitlabFilter = () => {
  const [filter, setFilter] = useState<GitlabFilter>(
    gitlabFilterStorage.fallback || GITLAB_FILTERS.REVIEW,
  );

  useEffect(() => {
    gitlabFilterStorage.getValue().then(setFilter);
    return gitlabFilterStorage.watch(setFilter);
  }, []);

  const updateFilter = (newFilter: GitlabFilter) => {
    setFilter(newFilter);
    gitlabFilterStorage.setValue(newFilter);
  };

  return [filter, updateFilter] as const;
};
