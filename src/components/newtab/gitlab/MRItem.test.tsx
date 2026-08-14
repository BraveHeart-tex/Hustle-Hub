import { parseHTML } from 'linkedom';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { MRItem } from '@/components/newtab/gitlab/MRItem';
import { type GitlabMergeRequest } from '@/types/gitlab';

vi.mock('@/components/newtab/misc/WorkItemComments', () => ({
  WorkItemComments: () => null,
}));

let mountedRoot: ReturnType<typeof createRoot> | null = null;
let restoreDom: (() => void) | null = null;

const baseMergeRequest: GitlabMergeRequest = {
  id: 'gid://gitlab/MergeRequest/905',
  iid: '905',
  title: 'WEB-1901 Debounce address autocomplete requests',
  createdAt: new Date().toISOString(),
  sourceBranch: 'feature/WEB-1901-address-autocomplete-debounce',
  targetBranch: 'main',
  draft: false,
  mergeStatus: 'needs_review',
  webUrl: 'https://gitlab.example.com/commerce/storefront/-/merge_requests/905',
  userNotesCount: 3,
  author: { id: 27, username: 'sam.rivera', avatarUrl: '' },
  approvedBy: 1,
  approvalsRequired: 2,
  labels: [],
  reviewers: [],
  needsCurrentUserAction: false,
  conflicts: false,
  needsRebase: true,
  autoMergeEnabled: false,
  headPipelineStatus: 'SUCCESS',
  projectName: 'storefront',
  projectId: '101',
  diffStatsSummary: { additions: 58, deletions: 12 },
} as GitlabMergeRequest;

describe('MRItem', () => {
  afterEach(() => {
    act(() => mountedRoot?.unmount());
    mountedRoot = null;
    restoreDom?.();
    restoreDom = null;
    vi.unstubAllEnvs();
  });

  it('shows the Needs rebase badge when the current user authored the MR', () => {
    vi.stubEnv('VITE_GITLAB_USER_ID', '27');
    const container = render({
      ...baseMergeRequest,
      author: { id: 27, username: 'sam.rivera', avatarUrl: '' },
    });

    expect(container.textContent).toContain('Needs rebase');
  });

  it('hides the Needs rebase badge when a different user authored the MR', () => {
    vi.stubEnv('VITE_GITLAB_USER_ID', '27');
    const container = render({
      ...baseMergeRequest,
      author: { id: 99, username: 'other.person', avatarUrl: '' },
    });

    expect(container.textContent).not.toContain('Needs rebase');
  });

  it('shows the Needs rebase badge when VITE_GITLAB_USER_ID is unset', () => {
    vi.stubEnv('VITE_GITLAB_USER_ID', '');
    const container = render({
      ...baseMergeRequest,
      author: { id: 99, username: 'other.person', avatarUrl: '' },
    });

    expect(container.textContent).toContain('Needs rebase');
  });
});

function render(mergeRequest: GitlabMergeRequest): HTMLElement {
  const { document, window } = parseHTML('<html><body></body></html>');
  const globals = globalThis as Record<string, unknown>;
  const previous = { document: globals.document, window: globals.window };
  globals.document = document;
  globals.window = window;
  restoreDom = () => Object.assign(globals, previous);
  (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

  act(() => {
    mountedRoot = createRoot(document.body);
    mountedRoot.render(<MRItem mr={mergeRequest} />);
  });
  return document.body;
}
