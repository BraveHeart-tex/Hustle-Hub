import { useApi } from '@/hooks/useApi';
import { type JiraFilter, QUERY_KEYS } from '@/lib/constants';
import { getMockJiraIssues, isMockDataEnabled } from '@/lib/mockData';
import { fetchJiraIssues } from '@/services/jira';

interface UseJiraTicketsOptions {
  enabled?: boolean;
}

export const useJiraTickets = (
  filter: JiraFilter,
  options?: UseJiraTicketsOptions,
) =>
  useApi(
    QUERY_KEYS.jira.issues(filter),
    async (signal) => {
      if (isMockDataEnabled) {
        return { issues: getMockJiraIssues(filter) };
      }

      return fetchJiraIssues(filter, signal);
    },
    options,
  );
