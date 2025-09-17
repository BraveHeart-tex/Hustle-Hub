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

export const QUERY_KEYS = {
  JIRA_ISSUES: (filter: JiraFilter) => ['jiraIssues', filter] as const,
  CALENDAR_EVENTS: ['calendarEvents'] as const,
  GITLAB_MRS: (filter: GitlabFilter) => ['gitlabMrs', filter] as const,
} as const;

export const GITLAB_FILTERS = {
  ASSIGNED: 'assigned',
  REVIEW: 'review',
} as const;
export type GitlabFilter = (typeof GITLAB_FILTERS)[keyof typeof GITLAB_FILTERS];

export const NOTE_PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
} as const;
export type NotePriority =
  (typeof NOTE_PRIORITIES)[keyof typeof NOTE_PRIORITIES];
