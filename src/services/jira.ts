import type { JiraFilter } from '@/lib/constants';
import { apiClient, executeMutation, executeRead } from '@/services/api/client';
import type { JiraIssue, JiraIssueDetails } from '@/types/jira';

export type { JiraIssueDetails, JiraTransition } from '@/types/jira';

export async function fetchJiraIssues(
  filter: JiraFilter,
  signal?: AbortSignal,
): Promise<{ issues: JiraIssue[] }> {
  return executeRead(
    () =>
      apiClient.GET('/api/data/jira/issues/', {
        params: { query: { filter } },
        signal,
      }),
    signal,
  );
}

export const fetchFerelKey = async (
  jiraId: string,
  signal?: AbortSignal,
): Promise<string> => {
  try {
    const data = await executeRead(
      () =>
        apiClient.GET('/api/data/jira/issues/by-feature-key/{featureKey}/', {
          params: { path: { featureKey: jiraId } },
          signal,
        }),
      signal,
    );
    return data.issue?.key ?? 'FEREL-TASK_NUMBER_HERE';
  } catch (error) {
    if (signal?.aborted) throw error;
    console.warn(`Failed to fetch FEREL key for ${jiraId}:`, error);
    return 'FEREL-TASK_NUMBER_HERE';
  }
};

export const fetchJiraIssueDetails = async (
  jiraId: string,
  signal?: AbortSignal,
): Promise<JiraIssueDetails> => {
  return executeRead(
    () =>
      apiClient.GET('/api/data/jira/issues/{issueKey}/', {
        params: { path: { issueKey: jiraId } },
        signal,
      }),
    signal,
  );
};

export const transitionJiraIssue = async (
  jiraId: string,
  transitionId: string,
) => {
  await executeMutation(() =>
    apiClient.POST('/api/data/jira/issues/{issueKey}/transition', {
      params: { path: { issueKey: jiraId } },
      body: { transitionId },
    }),
  );
};

export const addJiraIssueComment = async ({
  jiraId,
  mrUrl,
}: {
  jiraId: string;
  mrUrl: string;
}) => {
  await executeMutation(() =>
    apiClient.POST('/api/data/jira/issues/{issueKey}/comment', {
      params: { path: { issueKey: jiraId } },
      body: { mrUrl },
    }),
  );
};
