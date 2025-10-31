export const getJiraTaskUrl = (issueKey: string): string => {
  return `https://letgotr.atlassian.net/browse/${issueKey}`;
};
