import { parseHTML } from 'linkedom';
import { act, type ComponentProps } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { JiraStatusButton } from '@/components/mr-thread-panel/JiraStatusButton';

const mocks = vi.hoisted(() => ({
  addJiraIssueComment: vi.fn(),
  fetchJiraIssueDetails: vi.fn(),
  transitionJiraIssue: vi.fn(),
}));

vi.mock('@/services/jira', () => mocks);

let mountedRoot: ReturnType<typeof createRoot> | null = null;
let restoreDom: (() => void) | null = null;

describe('JiraStatusButton', () => {
  afterEach(() => {
    act(() => mountedRoot?.unmount());
    mountedRoot = null;
    restoreDom?.();
    restoreDom = null;
    mocks.fetchJiraIssueDetails.mockReset();
  });

  it('keeps release Jira interpretation in the caller with snapshot description text', async () => {
    mocks.fetchJiraIssueDetails.mockResolvedValue({
      fields: {
        status: { name: 'To Do', statusCategory: { colorName: 'blue-gray' } },
      },
      transitions: [],
    });
    const container = render({
      assigneeIds: ['100'],
      description: 'Release: FEREL-42',
      mrUrl: 'https://gitlab.com/group/project/-/merge_requests/42',
      targetBranch: 'main',
    });

    await act(async () => {
      await new Promise<void>((resolve) => queueMicrotask(resolve));
    });

    expect(container.textContent).toContain('FEREL-42');
    expect(mocks.fetchJiraIssueDetails).toHaveBeenCalledWith('FEREL-42');
  });

  it('keeps unavailable assignees read-only instead of treating them as empty', async () => {
    mocks.fetchJiraIssueDetails.mockResolvedValue({
      fields: {},
      transitions: [
        {
          id: '1',
          name: 'Start progress',
          to: { name: 'In Progress', statusCategory: { colorName: 'blue' } },
        },
      ],
    });
    const container = render({
      assigneeIds: null,
      description: null,
      mrUrl: 'https://gitlab.com/group/project/-/merge_requests/42',
      targetBranch: 'develop',
    });

    expect(container.textContent).toContain('ABC-1');
    await flushPromises();
    await act(async () => {
      container.querySelector('button')?.click();
    });
    expect(container.textContent).not.toContain('Start progress');
  });

  it('does not apply a previous MR request after the Jira input changes', async () => {
    const requestResolvers: Array<(value: unknown) => void> = [];
    mocks.fetchJiraIssueDetails.mockImplementation(
      () =>
        new Promise((resolve) => {
          requestResolvers.push(resolve);
        }),
    );
    const container = render({
      assigneeIds: ['100'],
      description: null,
      mrUrl: 'https://gitlab.com/group/project/-/merge_requests/42',
      targetBranch: 'develop',
    });

    await flushPromises();
    rerender({
      assigneeIds: ['100'],
      description: null,
      mrUrl: 'https://gitlab.com/group/project/-/merge_requests/43',
      targetBranch: 'develop',
    });
    await flushPromises();

    requestResolvers[0]?.({
      fields: {
        status: { name: 'Stale status', statusCategory: { colorName: 'blue' } },
      },
      transitions: [],
    });
    await flushPromises();

    expect(container.textContent).not.toContain('Stale status');
  });
});

function render(
  facts: Pick<
    ComponentProps<typeof JiraStatusButton>,
    'assigneeIds' | 'description' | 'mrUrl' | 'targetBranch'
  >,
): HTMLElement {
  const { document, window } = parseHTML('<html><body></body></html>');
  const globals = globalThis as Record<string, unknown>;
  const previous = { document: globals.document, window: globals.window };
  globals.document = document;
  globals.window = window;
  restoreDom = () => Object.assign(globals, previous);
  (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

  act(() => {
    mountedRoot = createRoot(document.body);
    mountedRoot.render(
      <JiraStatusButton
        {...facts}
        container={document.body}
        gitlabUserId="100"
        jiraId="ABC-1"
        jiraLink="https://jira.example/ABC-1"
      />,
    );
  });
  return document.body;
}

function rerender(
  facts: Pick<
    ComponentProps<typeof JiraStatusButton>,
    'assigneeIds' | 'description' | 'mrUrl' | 'targetBranch'
  >,
): void {
  act(() => {
    mountedRoot?.render(
      <JiraStatusButton
        {...facts}
        container={document.body}
        gitlabUserId="100"
        jiraId="ABC-1"
        jiraLink="https://jira.example/ABC-1"
      />,
    );
  });
}

async function flushPromises(): Promise<void> {
  await act(async () => {
    await new Promise<void>((resolve) => queueMicrotask(resolve));
  });
}
