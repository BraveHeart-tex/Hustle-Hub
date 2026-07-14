import { GITLAB_CATEGORIES, JIRA_FILTERS } from '@/lib/constants';

export const SEARCH_SHORTCUT = {
  ariaKeyShortcuts: 'Meta+K Control+K',
  keys: ['Cmd/Ctrl', 'K'],
} as const;

export const GITLAB_CATEGORY_SHORTCUTS = [
  {
    label: 'Review requested',
    shortcutKeys: ['g', 'r'],
    key: 'r',
    value: GITLAB_CATEGORIES.REVIEW_REQUESTED,
  },
  {
    label: 'Assigned to me',
    shortcutKeys: ['g', 'a'],
    key: 'a',
    value: GITLAB_CATEGORIES.ASSIGNED_TO_ME,
  },
  {
    label: 'Draft merge requests',
    shortcutKeys: ['g', 'd'],
    key: 'd',
    value: GITLAB_CATEGORIES.DRAFTS,
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
