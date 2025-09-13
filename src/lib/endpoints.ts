import { JiraFilter } from '@/lib/constants';

export const ENDPOINTS = {
  CALENDAR_EVENTS: `${import.meta.env.VITE_BASE_API_URL}/data/google-calendar/events`,
  GITLAB_MRS: `${import.meta.env.VITE_BASE_API_URL}/data/gitlab/mrs`,
  JIRA_ISSUES: (filter: JiraFilter) =>
    `${import.meta.env.VITE_BASE_API_URL}/data/jira/issues?filter=${filter}`,
};
