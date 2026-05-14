import { ENDPOINTS } from '@/lib/endpoints';

export interface JiraTransition {
  id: string;
  name: string;
  to: { name: string; statusCategory: { colorName: string } };
}

export interface JiraIssueDetails {
  key: string;
  fields: {
    summary: string;
    status: { name: string; statusCategory: { colorName: string } };
    priority: { name: string; iconUrl: string };
    assignee: { displayName: string; avatarUrls: { '24x24': string } } | null;
    description: unknown;
  };
  transitions: JiraTransition[];
}

export const fetchFerelKey = async (jiraId: string): Promise<string> => {
  try {
    const response = await fetch(ENDPOINTS.jira.issueByFeatureKey(jiraId));
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return data.data.issue?.key ?? 'FEREL-TASK_NUMBER_HERE';
  } catch (error) {
    console.warn(`Failed to fetch FEREL key for ${jiraId}:`, error);
    return 'FEREL-TASK_NUMBER_HERE';
  }
};

export const fetchJiraIssueDetails = async (
  jiraId: string,
): Promise<JiraIssueDetails> => {
  const response = await fetch(ENDPOINTS.jira.issue(jiraId));

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.data;
};

export const transitionJiraIssue = async (
  jiraId: string,
  transitionId: string,
) => {
  const response = await fetch(ENDPOINTS.jira.issueTransition(jiraId), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transitionId }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
};

export const addJiraIssueComment = async ({
  jiraId,
  mrUrl,
  mrTitle,
}: {
  jiraId: string;
  mrUrl: string;
  mrTitle: string;
}) => {
  const response = await fetch(ENDPOINTS.jira.issueComment(jiraId), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mrUrl, mrTitle }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
};
