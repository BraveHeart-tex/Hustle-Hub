export const TEAM_SLUGS = ['FE', 'ORD', 'DIS', 'PE', 'PRD', 'MEM', 'MOD'];
export const AUTH_CALLBACK_STATUSES = {
  SUCCESS: 'success',
  FAILURE: 'failure',
} as const;

export const JIRA_FILTERS = {
  LITERALLY_WORKING_ON: 'literally_working_on',
  FOR_YOU: 'for_you',
} as const;
export type JiraFilter = (typeof JIRA_FILTERS)[keyof typeof JIRA_FILTERS];
