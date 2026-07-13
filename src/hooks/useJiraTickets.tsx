import { useApi } from '@/hooks/useApi';
import { type JiraFilter, QUERY_KEYS } from '@/lib/constants';
import { ENDPOINTS } from '@/lib/endpoints';
import { getMockJiraIssues, isMockDataEnabled } from '@/lib/mockData';
import { type ApiResponse } from '@/types/api';
import { type JiraIssue } from '@/types/jira';

interface UseJiraTicketsOptions {
  enabled?: boolean;
}

export const useJiraTickets = (
  filter: JiraFilter,
  options?: UseJiraTicketsOptions,
) =>
  useApi(
    QUERY_KEYS.jira.issues(filter),
    async () => {
      if (isMockDataEnabled) {
        return {
          success: true,
          data: { issues: getMockJiraIssues(filter) },
        };
      }

      const response = await fetch(ENDPOINTS.jira.issues(filter));
      return (await response.json()) as ApiResponse<{ issues: JiraIssue[] }>;
    },
    options,
  );
