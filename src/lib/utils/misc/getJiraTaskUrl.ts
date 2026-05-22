const JIRA_BASE_URL = import.meta.env.VITE_JIRA_BASE_URL.replace(/\/$/, '');

export const getJiraTaskUrl = (issueKey: string): string => {
  return `${JIRA_BASE_URL}/browse/${issueKey}`;
};

export const getJiraForYouUrl = (): string => {
  return `${JIRA_BASE_URL}/jira/for-you`;
};
