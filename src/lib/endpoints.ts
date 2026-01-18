import { GitlabFilter, JiraFilter } from '@/lib/constants';

export const ENDPOINTS = {
  CALENDAR_EVENTS: `${import.meta.env.VITE_BASE_API_URL}/data/google-calendar/events`,
  GITLAB_MRS: (filter: GitlabFilter) =>
    `${import.meta.env.VITE_BASE_API_URL}/data/gitlab/merge-requests?filter=${filter}`,
  JIRA_ISSUES: (filter: JiraFilter) =>
    `${import.meta.env.VITE_BASE_API_URL}/data/jira/issues?filter=${filter}`,
};
