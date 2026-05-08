import { useApi } from '@/hooks/useApi';
import { type JiraFilter, QUERY_KEYS } from '@/lib/constants';
import { ENDPOINTS } from '@/lib/endpoints';
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
      const response = await fetch(ENDPOINTS.jira.issues(filter));
      return (await response.json()) as ApiResponse<{ issues: JiraIssue[] }>;
    },
    options,
  );
