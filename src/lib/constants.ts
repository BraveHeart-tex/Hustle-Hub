import type { paths } from '@/generated/openapi';

type JiraFilterParam = NonNullable<
  NonNullable<
    paths['/api/data/jira/issues/']['get']['parameters']['query']
  >['filter']
>;

export const JIRA_FILTERS = {
  LITERALLY_WORKING_ON: 'literally_working_on',
  FRONTEND_RELEASES: 'frontend_releases',
} as const satisfies Record<string, JiraFilterParam>;

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

export type GitlabFilter =
  paths['/api/data/gitlab/merge-requests/']['get']['parameters']['query']['filter'];

export const GITLAB_FILTERS = {
  ASSIGNED: 'assigned',
  REVIEW: 'review',
} as const satisfies Record<string, GitlabFilter>;

export const GITLAB_CATEGORIES = {
  REVIEW_REQUESTED: 'review_requested',
  ASSIGNED_TO_ME: 'assigned_to_me',
  DRAFTS: 'drafts',
} as const;
export type GitlabCategory =
  (typeof GITLAB_CATEGORIES)[keyof typeof GITLAB_CATEGORIES];

export type NotePriority = 'low' | 'medium' | 'high';

export const GITLAB_HIGHLIGHTED_THREAD_CLASS = '__hb-gitlab-highlighted-thread';
