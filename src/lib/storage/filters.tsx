import { useEffect, useState } from 'react';

import { JIRA_FILTERS, type JiraFilter } from '@/lib/constants';

const jiraFilterStorage = storage.defineItem<JiraFilter>('local:jiraFilter', {
  fallback: JIRA_FILTERS.LITERALLY_WORKING_ON,
});

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
