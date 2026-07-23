import { parseHTML } from 'linkedom';
import { act, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { MrThreadApp } from '@/components/mr-thread-panel/MrThreadApp';
import { createGitLabMrPage } from '@/lib/gitlab-mr-page/gitlabMrPage';
import { GitLabMrPageProvider } from '@/lib/gitlab-mr-page/gitlabMrPageReact';
import { createGitLabMrFixtureHost } from '@/lib/gitlab-mr-page/testing/createGitLabMrFixtureHost';
import darkOverviewHtml from '@/lib/gitlab-mr-page/testing/fixtures/mr-overview.html?raw';

vi.mock('@/components/mr-thread-panel/BottomRightPanel', () => ({
  BottomRightPanel: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
vi.mock('@/components/mr-thread-panel/JiraStatusButton', () => ({
  JiraStatusButton: () => null,
}));
vi.mock('@/components/mr-thread-panel/ThreadList', () => ({
  ThreadList: () => null,
}));
vi.mock('@/components/mr-thread-panel/CodeReviewCommandsShortcut', () => ({
  CodeReviewCommandsShortcut: () => null,
}));

let mountedRoot: ReturnType<typeof createRoot> | null = null;
let restoreDom: (() => void) | null = null;

describe('MrThreadApp', () => {
  afterEach(() => {
    act(() => mountedRoot?.unmount());
    mountedRoot = null;
    restoreDom?.();
    restoreDom = null;
  });

  it('mirrors the page module host appearance and updates after reconciliation', async () => {
    const host = createGitLabMrFixtureHost({
      href: 'https://gitlab.com/group/project/-/merge_requests/42',
      html: darkOverviewHtml,
    });
    const page = createGitLabMrPage(host);
    const container = render(page);

    expect(container.classList.contains('dark')).toBe(true);
    await reconcile();
    expect(container.classList.contains('dark')).toBe(true);

    host.replaceDocument(darkOverviewHtml.replace('class="gl-dark"', ''));
    act(() => host.emitMutation());
    await reconcile();

    expect(container.classList.contains('dark')).toBe(false);
  });
});

function render(page: ReturnType<typeof createGitLabMrPage>): HTMLElement {
  const { document, window } = parseHTML('<html><body></body></html>');
  const globals = globalThis as Record<string, unknown>;
  const previous = { document: globals.document, window: globals.window };
  globals.document = document;
  globals.window = window;
  restoreDom = () => Object.assign(globals, previous);
  (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement('div');
  document.body.append(container);
  act(() => {
    mountedRoot = createRoot(container);
    mountedRoot.render(
      <GitLabMrPageProvider value={page}>
        <MrThreadApp container={container} gitlabUserId="100" />
      </GitLabMrPageProvider>,
    );
  });
  return container;
}

async function reconcile(): Promise<void> {
  await act(async () => {
    await new Promise<void>((resolve) => queueMicrotask(resolve));
  });
}
