export const JIRA_FILTERS = {
  LITERALLY_WORKING_ON: 'literally_working_on',
  FOR_YOU: 'for_you',
  FRONTEND_RELEASES: 'frontend_releases',
} as const;
export type JiraFilter = (typeof JIRA_FILTERS)[keyof typeof JIRA_FILTERS];

export const QUERY_KEYS = {
  calendar: {
    events: ['calendar', 'events'] as const,
  },
  gitlab: {
    mergeRequests: (filter: GitlabFilter) =>
      ['gitlab', 'mergeRequests', filter] as const,
  },
  jira: {
    issues: (filter: JiraFilter) => ['jira', 'issues', filter] as const,
    issueByFeatureKey: (featureKey: string) =>
      ['jira', 'issueByFeatureKey', featureKey] as const,
  },
  attention: {
    list: ['attention', 'list'] as const,
  },
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

export const GITLAB_HIGHLIGHTED_THREAD_CLASS = '__hb-gitlab-highlighted-thread';
