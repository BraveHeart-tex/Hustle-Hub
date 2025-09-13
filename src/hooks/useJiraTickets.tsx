import { useApi } from '@/hooks/useApi';
import { JiraFilter, QUERY_KEYS } from '@/lib/constants';
import { ENDPOINTS } from '@/lib/endpoints';
import { ApiResponse } from '@/types/api';
import { JiraIssue } from '@/types/jira';

export const useJiraTickets = (filter: JiraFilter) =>
  useApi(QUERY_KEYS.JIRA_ISSUES(filter), async () => {
    const response = await fetch(ENDPOINTS.JIRA_ISSUES(filter));
    return (await response.json()) as ApiResponse<{ issues: JiraIssue[] }>;
  });
