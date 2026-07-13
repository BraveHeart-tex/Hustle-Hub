import {
  GITLAB_FILTERS,
  type GitlabFilter,
  JIRA_FILTERS,
  type JiraFilter,
} from '@/lib/constants';
import { getJiraTaskUrl } from '@/lib/utils/misc/getJiraTaskUrl';
import type { AttentionItem } from '@/types/attention';
import type { GitlabMergeRequest } from '@/types/gitlab';
import type { JiraIssue } from '@/types/jira';

export const isMockDataEnabled = import.meta.env.VITE_USE_MOCK_DATA === 'true';

const hoursAgo = (hours: number): string =>
  new Date(Date.now() - hours * 60 * 60 * 1_000).toISOString();

const daysAgo = (days: number): string => hoursAgo(days * 24);

const jiraAvatarUrls = {
  '16x16': 'https://i.pravatar.cc/16?img=12',
  '24x24': 'https://i.pravatar.cc/24?img=12',
  '32x32': 'https://i.pravatar.cc/32?img=12',
  '48x48': 'https://i.pravatar.cc/48?img=12',
};

const jiraStatuses = {
  selected: { name: 'Selected for Development', colorName: 'blue-gray' },
  progress: { name: 'In Progress', colorName: 'yellow' },
  review: { name: 'In Review', colorName: 'yellow' },
  done: { name: 'Done', colorName: 'green' },
} as const;

const jiraPriorities = {
  highest: { id: '1', name: 'Highest', icon: 'highest' },
  high: { id: '2', name: 'High', icon: 'high' },
  medium: { id: '3', name: 'Medium', icon: 'medium' },
  low: { id: '4', name: 'Low', icon: 'low' },
} as const;

function createJiraIssue({
  id,
  key,
  summary,
  status,
  priority,
  createdDaysAgo,
  updatedHoursAgo,
}: {
  id: string;
  key: string;
  summary: string;
  status: (typeof jiraStatuses)[keyof typeof jiraStatuses];
  priority: (typeof jiraPriorities)[keyof typeof jiraPriorities];
  createdDaysAgo: number;
  updatedHoursAgo: number;
}): JiraIssue {
  const self = `https://jira.example.com/rest/api/3/issue/${id}`;

  return {
    expand: 'names,schema',
    id,
    self,
    key,
    fields: {
      summary,
      assignee: {
        self: 'https://jira.example.com/rest/api/3/user?accountId=mock-user',
        accountId: 'mock-user',
        emailAddress: 'alex.morgan@example.com',
        avatarUrls: jiraAvatarUrls,
        displayName: 'Alex Morgan',
        active: true,
        timeZone: 'Europe/Istanbul',
        accountType: 'atlassian',
      },
      priority: {
        self: `https://jira.example.com/rest/api/3/priority/${priority.id}`,
        iconUrl: `https://jira.atlassian.com/images/icons/priorities/${priority.icon}.svg`,
        name: priority.name,
        id: priority.id,
      },
      created: daysAgo(createdDaysAgo),
      updated: hoursAgo(updatedHoursAgo),
      status: {
        self: `https://jira.example.com/rest/api/3/status/${status.name}`,
        description: `The issue is currently ${status.name.toLowerCase()}.`,
        iconUrl: '',
        name: status.name,
        id: status.name.toLowerCase().replaceAll(' ', '-'),
        statusCategory: {
          self: 'https://jira.example.com/rest/api/3/statuscategory/4',
          id: status.colorName === 'green' ? 3 : 4,
          key: status.colorName === 'green' ? 'done' : 'indeterminate',
          colorName: status.colorName,
          name: status.colorName === 'green' ? 'Done' : 'In Progress',
        },
      },
    },
  };
}

const mockJiraIssues: Record<JiraFilter, JiraIssue[]> = {
  [JIRA_FILTERS.LITERALLY_WORKING_ON]: [
    createJiraIssue({
      id: '10421',
      key: 'WEB-1842',
      summary: 'Persist checkout state when payment authentication is retried',
      status: jiraStatuses.progress,
      priority: jiraPriorities.high,
      createdDaysAgo: 8,
      updatedHoursAgo: 2,
    }),
    createJiraIssue({
      id: '10408',
      key: 'WEB-1827',
      summary: 'Add empty-state guidance to the saved addresses panel',
      status: jiraStatuses.review,
      priority: jiraPriorities.medium,
      createdDaysAgo: 12,
      updatedHoursAgo: 5,
    }),
    createJiraIssue({
      id: '10396',
      key: 'PLAT-611',
      summary: 'Migrate storefront feature flags to the typed client',
      status: jiraStatuses.progress,
      priority: jiraPriorities.medium,
      createdDaysAgo: 16,
      updatedHoursAgo: 20,
    }),
    createJiraIssue({
      id: '10381',
      key: 'WEB-1794',
      summary: 'Fix keyboard focus after closing the product gallery',
      status: jiraStatuses.done,
      priority: jiraPriorities.high,
      createdDaysAgo: 21,
      updatedHoursAgo: 28,
    }),
  ],
  [JIRA_FILTERS.FOR_YOU]: [
    createJiraIssue({
      id: '10439',
      key: 'WEB-1856',
      summary: 'Investigate elevated cart API latency on mobile sessions',
      status: jiraStatuses.selected,
      priority: jiraPriorities.highest,
      createdDaysAgo: 2,
      updatedHoursAgo: 1,
    }),
    createJiraIssue({
      id: '10433',
      key: 'DES-903',
      summary: 'Review responsive behavior for the new order timeline',
      status: jiraStatuses.selected,
      priority: jiraPriorities.medium,
      createdDaysAgo: 4,
      updatedHoursAgo: 8,
    }),
    createJiraIssue({
      id: '10421',
      key: 'WEB-1842',
      summary: 'Persist checkout state when payment authentication is retried',
      status: jiraStatuses.progress,
      priority: jiraPriorities.high,
      createdDaysAgo: 8,
      updatedHoursAgo: 2,
    }),
    createJiraIssue({
      id: '10418',
      key: 'DATA-418',
      summary: 'Confirm analytics events for one-click reorder',
      status: jiraStatuses.review,
      priority: jiraPriorities.low,
      createdDaysAgo: 9,
      updatedHoursAgo: 13,
    }),
  ],
  [JIRA_FILTERS.FRONTEND_RELEASES]: [
    createJiraIssue({
      id: '10444',
      key: 'REL-732',
      summary: 'Storefront production release 2026.07.13',
      status: jiraStatuses.progress,
      priority: jiraPriorities.high,
      createdDaysAgo: 1,
      updatedHoursAgo: 1,
    }),
    createJiraIssue({
      id: '10431',
      key: 'REL-728',
      summary: 'Account portal production release 2026.07.10',
      status: jiraStatuses.done,
      priority: jiraPriorities.medium,
      createdDaysAgo: 4,
      updatedHoursAgo: 70,
    }),
    createJiraIssue({
      id: '10417',
      key: 'REL-721',
      summary: 'Checkout hotfix release for payment retry handling',
      status: jiraStatuses.done,
      priority: jiraPriorities.highest,
      createdDaysAgo: 7,
      updatedHoursAgo: 145,
    }),
  ],
};

const avatars = {
  alex: 'https://i.pravatar.cc/64?img=12',
  maya: 'https://i.pravatar.cc/64?img=47',
  deniz: 'https://i.pravatar.cc/64?img=15',
  sam: 'https://i.pravatar.cc/64?img=5',
};

const reviewer = (id: number, avatarUrl: string, hasApproved = false) => ({
  id,
  avatarUrl,
  hasApproved,
});

const commonMergeRequestFields = {
  targetBranch: 'main',
  autoMergeEnabled: false,
} as const;

const reviewMergeRequests: GitlabMergeRequest[] = [
  {
    ...commonMergeRequestFields,
    iid: '842',
    title: 'WEB-1842 Preserve checkout after 3DS authentication retry',
    createdAt: daysAgo(2),
    sourceBranch: 'feature/WEB-1842-checkout-retry',
    draft: false,
    mergeStatus: 'needs_review',
    webUrl:
      'https://gitlab.example.com/commerce/storefront/-/merge_requests/842',
    userNotesCount: 6,
    author: { username: 'maya.chen', avatarUrl: avatars.maya },
    approvedBy: 1,
    approvalsRequired: 2,
    labels: [
      { color: '#1f75cb', title: 'frontend' },
      { color: '#d93f0b', title: 'priority::high' },
    ],
    reviewers: [reviewer(12, avatars.alex), reviewer(18, avatars.deniz, true)],
    needsCurrentUserAction: true,
    conflicts: false,
    headPipelineStatus: 'SUCCESS',
    projectName: 'storefront',
    projectId: '101',
    diffStatsSummary: { additions: 184, deletions: 63 },
  },
  {
    ...commonMergeRequestFields,
    iid: '317',
    title: 'PLAT-611 Add typed storefront feature-flag client',
    createdAt: daysAgo(4),
    sourceBranch: 'feature/PLAT-611-typed-flags',
    draft: false,
    mergeStatus: 'cannot_be_merged',
    webUrl:
      'https://gitlab.example.com/platform/web-foundation/-/merge_requests/317',
    userNotesCount: 11,
    author: { username: 'deniz.kaya', avatarUrl: avatars.deniz },
    approvedBy: 0,
    approvalsRequired: 2,
    labels: [{ color: '#6f42c1', title: 'platform' }],
    reviewers: [reviewer(12, avatars.alex), reviewer(27, avatars.sam)],
    needsCurrentUserAction: false,
    conflicts: true,
    headPipelineStatus: 'FAILED',
    projectName: 'web-foundation',
    projectId: '205',
    diffStatsSummary: { additions: 429, deletions: 211 },
  },
  {
    ...commonMergeRequestFields,
    iid: '838',
    title: 'DES-903 Refine responsive order timeline spacing',
    createdAt: daysAgo(1),
    sourceBranch: 'feature/DES-903-order-timeline',
    draft: true,
    mergeStatus: 'unchecked',
    webUrl:
      'https://gitlab.example.com/commerce/storefront/-/merge_requests/838',
    userNotesCount: 2,
    author: { username: 'sam.rivera', avatarUrl: avatars.sam },
    approvedBy: 0,
    approvalsRequired: 2,
    labels: [{ color: '#0e8a16', title: 'ux' }],
    reviewers: [reviewer(12, avatars.alex)],
    needsCurrentUserAction: false,
    conflicts: false,
    headPipelineStatus: 'RUNNING',
    projectName: 'storefront',
    projectId: '101',
    diffStatsSummary: { additions: 96, deletions: 34 },
  },
];

const assignedMergeRequests: GitlabMergeRequest[] = [
  {
    ...commonMergeRequestFields,
    iid: '846',
    title: 'WEB-1856 Add tracing for slow cart API responses',
    createdAt: hoursAgo(15),
    sourceBranch: 'fix/WEB-1856-cart-tracing',
    draft: false,
    mergeStatus: 'approved',
    webUrl:
      'https://gitlab.example.com/commerce/storefront/-/merge_requests/846',
    userNotesCount: 4,
    author: { username: 'alex.morgan', avatarUrl: avatars.alex },
    approvedBy: 2,
    approvalsRequired: 2,
    labels: [
      { color: '#d93f0b', title: 'priority::high' },
      { color: '#fbca04', title: 'observability' },
    ],
    reviewers: [
      reviewer(18, avatars.deniz, true),
      reviewer(27, avatars.sam, true),
    ],
    needsCurrentUserAction: false,
    conflicts: false,
    headPipelineStatus: 'SUCCESS',
    projectName: 'storefront',
    projectId: '101',
    autoMergeEnabled: true,
    diffStatsSummary: { additions: 73, deletions: 18 },
  },
  {
    ...commonMergeRequestFields,
    iid: '119',
    title: 'REL-732 Prepare production release metadata',
    createdAt: daysAgo(1),
    sourceBranch: 'release/2026-07-13',
    targetBranch: 'production',
    draft: false,
    mergeStatus: 'needs_review',
    webUrl:
      'https://gitlab.example.com/commerce/release-tools/-/merge_requests/119',
    userNotesCount: 1,
    author: { username: 'alex.morgan', avatarUrl: avatars.alex },
    approvedBy: 1,
    approvalsRequired: 2,
    labels: [{ color: '#c5def5', title: 'release' }],
    reviewers: [reviewer(18, avatars.deniz, true), reviewer(47, avatars.maya)],
    needsCurrentUserAction: false,
    conflicts: false,
    headPipelineStatus: 'MANUAL',
    projectName: 'release-tools',
    projectId: '309',
    diffStatsSummary: { additions: 24, deletions: 7 },
  },
  {
    ...commonMergeRequestFields,
    iid: '839',
    title: 'WEB-1827 Add saved-address empty state',
    createdAt: daysAgo(5),
    sourceBranch: 'feature/WEB-1827-address-empty-state',
    draft: true,
    mergeStatus: 'unchecked',
    webUrl:
      'https://gitlab.example.com/commerce/storefront/-/merge_requests/839',
    userNotesCount: 3,
    author: { username: 'alex.morgan', avatarUrl: avatars.alex },
    approvedBy: 0,
    approvalsRequired: 2,
    labels: [{ color: '#1f75cb', title: 'frontend' }],
    reviewers: [reviewer(47, avatars.maya)],
    needsCurrentUserAction: false,
    conflicts: false,
    headPipelineStatus: 'PENDING',
    projectName: 'storefront',
    projectId: '101',
    diffStatsSummary: { additions: 121, deletions: 14 },
  },
];

export function getMockJiraIssues(filter: JiraFilter): JiraIssue[] {
  return mockJiraIssues[filter];
}

export function getMockGitlabMergeRequests(
  filter: GitlabFilter,
): GitlabMergeRequest[] {
  if (filter === GITLAB_FILTERS.ASSIGNED) return assignedMergeRequests;

  return reviewMergeRequests;
}

export function getMockAttentionItems(): AttentionItem[] {
  return [
    {
      id: 'pipeline-failed:317',
      ruleId: 'pipeline-failed',
      priority: 'critical',
      status: 'active',
      source: 'gitlab',
      title: 'Pipeline failed',
      body: 'The test stage is failing in 3 jobs. The latest failure is in checkout-e2e.',
      entityId: '317',
      entityUrl:
        'https://gitlab.example.com/platform/web-foundation/-/merge_requests/317',
      entityTitle: 'PLAT-611 Add typed storefront feature-flag client',
      resolutionMode: 'auto',
      createdAt: hoursAgo(3),
      updatedAt: hoursAgo(1),
    },
    {
      id: 'merge-conflicts:317',
      ruleId: 'merge-conflicts',
      priority: 'critical',
      status: 'active',
      source: 'gitlab',
      title: 'Merge conflicts detected',
      body: 'This branch can no longer be merged into main without resolving conflicts.',
      entityId: '317',
      entityUrl:
        'https://gitlab.example.com/platform/web-foundation/-/merge_requests/317',
      entityTitle: 'PLAT-611 Add typed storefront feature-flag client',
      resolutionMode: 'auto',
      createdAt: hoursAgo(5),
      updatedAt: hoursAgo(2),
    },
    {
      id: 'review-requested:842',
      ruleId: 'review-requested',
      priority: 'warning',
      status: 'active',
      source: 'gitlab',
      title: 'Your review is requested',
      body: 'One approval is still needed before this can merge.',
      entityId: '842',
      entityUrl:
        'https://gitlab.example.com/commerce/storefront/-/merge_requests/842',
      entityTitle: 'WEB-1842 Preserve checkout after 3DS authentication retry',
      resolutionMode: 'auto',
      createdAt: hoursAgo(19),
      updatedAt: hoursAgo(4),
    },
    {
      id: 'stale-in-progress:WEB-1842',
      ruleId: 'stale-in-progress',
      priority: 'warning',
      status: 'active',
      source: 'jira',
      title: 'No Jira update for 3 days',
      body: 'The ticket is still In Progress and may need a status or comment update.',
      entityId: 'WEB-1842',
      entityUrl: getJiraTaskUrl('WEB-1842'),
      entityTitle:
        'Persist checkout state when payment authentication is retried',
      resolutionMode: 'manual',
      createdAt: hoursAgo(7),
      updatedAt: hoursAgo(7),
    },
    {
      id: 'release-today:REL-732',
      ruleId: 'release-today',
      priority: 'info',
      status: 'active',
      source: 'jira',
      title: 'Release scheduled for today',
      body: 'The storefront production release window begins at 16:00.',
      entityId: 'REL-732',
      entityUrl: getJiraTaskUrl('REL-732'),
      entityTitle: 'Storefront production release 2026.07.13',
      resolutionMode: 'manual',
      createdAt: hoursAgo(6),
      updatedAt: hoursAgo(6),
    },
    {
      id: 'ready-to-merge:846',
      ruleId: 'ready-to-merge',
      priority: 'info',
      status: 'active',
      source: 'gitlab',
      title: 'Merge request is ready',
      body: 'All approvals and pipeline checks have passed. Auto-merge is enabled.',
      entityId: '846',
      entityUrl:
        'https://gitlab.example.com/commerce/storefront/-/merge_requests/846',
      entityTitle: 'WEB-1856 Add tracing for slow cart API responses',
      resolutionMode: 'auto',
      createdAt: hoursAgo(2),
      updatedAt: hoursAgo(1),
    },
  ];
}
