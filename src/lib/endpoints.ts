import { GitlabFilter, JiraFilter } from '@/lib/constants';

const BASE = import.meta.env.VITE_BASE_API_URL;

export const ENDPOINTS = {
  gitlab: {
    mergeRequests: (filter: GitlabFilter) =>
      `${BASE}/data/gitlab/merge-requests?filter=${filter}`,
  },
  jira: {
    issues: (filter: JiraFilter) => `${BASE}/data/jira/issues?filter=${filter}`,
    issueByFeatureKey: (featureKey: string) =>
      `${BASE}/data/jira/issues/by-feature-key/${featureKey}`,
  },
  attention: {
    list: `${BASE}/attention`,
    stream: `${BASE}/attention/stream`,
    snooze: (id: string) => `${BASE}/attention/${id}/snooze`,
    dismiss: (id: string) => `${BASE}/attention/${id}/dismiss`,
  },
} as const;
