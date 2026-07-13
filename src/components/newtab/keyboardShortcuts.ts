import { GITLAB_FILTERS, JIRA_FILTERS } from '@/lib/constants';

export const SEARCH_SHORTCUT = {
  ariaKeyShortcuts: 'Meta+K Control+K',
  keys: ['Cmd/Ctrl', 'K'],
} as const;

export const GITLAB_FILTER_SHORTCUTS = [
  {
    label: 'Review Requested',
    shortcutKeys: ['g', 'r'],
    key: 'r',
    value: GITLAB_FILTERS.REVIEW,
  },
  {
    label: 'Assigned to me',
    shortcutKeys: ['g', 'a'],
    key: 'a',
    value: GITLAB_FILTERS.ASSIGNED,
  },
] as const;

export const JIRA_FILTER_SHORTCUTS = [
  {
    label: 'For You',
    shortcutKeys: ['j', 'f'],
    key: 'f',
    value: JIRA_FILTERS.FOR_YOU,
  },
  {
    label: 'Literally Working On',
    shortcutKeys: ['j', 'l'],
    key: 'l',
    value: JIRA_FILTERS.LITERALLY_WORKING_ON,
  },
  {
    label: 'Frontend Releases',
    shortcutKeys: ['j', 'r'],
    key: 'r',
    value: JIRA_FILTERS.FRONTEND_RELEASES,
  },
] as const;
