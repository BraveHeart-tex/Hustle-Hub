import { parseHTML } from 'linkedom';
import { act, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThreadList } from '@/components/mr-thread-panel/ThreadList';
import { createGitLabMrPage } from '@/lib/gitlab-mr-page/gitlabMrPage';
import { GitLabMrPageProvider } from '@/lib/gitlab-mr-page/gitlabMrPageReact';
import { createGitLabMrFixtureHost } from '@/lib/gitlab-mr-page/testing/createGitLabMrFixtureHost';
import emptyDiscussionsHtml from '@/lib/gitlab-mr-page/testing/fixtures/mr-overview-empty-discussions.html?raw';
import missingRegionsHtml from '@/lib/gitlab-mr-page/testing/fixtures/mr-overview-missing-regions.html?raw';
import discussionHtml from '@/lib/gitlab-mr-page/testing/fixtures/mr-overview-with-discussions.html?raw';

vi.mock('@/components/ui/popover', () => ({
  Popover: ({ children }: { children: ReactNode }) => <>{children}</>,
  PopoverContent: ({ children }: { children: ReactNode }) => <>{children}</>,
  PopoverTrigger: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

let mountedRoot: ReturnType<typeof createRoot> | null = null;
let restoreDom: (() => void) | null = null;

describe('ThreadList', () => {
  afterEach(() => {
    act(() => mountedRoot?.unmount());
    mountedRoot = null;
    restoreDom?.();
    restoreDom = null;
  });

  it('filters snapshot discussions for the current user, renders replies, and reveals the selected ref', async () => {
    const host = createGitLabMrFixtureHost({
      href: 'https://gitlab.com/group/project/-/merge_requests/42',
      html: discussionHtml,
    });
    const page = createGitLabMrPage(host);
    const container = render(page);

    await act(async () => {
      await new Promise<void>((resolve) => queueMicrotask(resolve));
    });
    expect(page.getSnapshot()).toMatchObject({
      discussions: [{ resolved: false }],
      status: 'ready',
    });
    await act(async () => {
      container.querySelector('button')?.click();
    });
    expect(container.textContent).toContain('1 open');
    await act(async () => {
      container
        .querySelector<HTMLElement>('[aria-label="Show 2 replies"]')
        ?.click();
    });
    expect(container.textContent).toContain('You');
    expect(container.textContent).toContain('Reply');
    await act(async () => {
      container
        .querySelector<HTMLElement>('[aria-label="Go to thread 1"]')
        ?.click();
    });

    expect(host.scrollRequests).toHaveLength(1);
    expect(
      host.scrollRequests[0].element.getAttribute('data-discussion-id'),
    ).toBe('discussion-1');
  });

  it('keeps missing discussion regions distinct from confirmed empty collections', async () => {
    const missingPage = createGitLabMrPage(
      createGitLabMrFixtureHost({
        href: 'https://gitlab.com/group/project/-/merge_requests/42',
        html: missingRegionsHtml,
      }),
    );
    const emptyPage = createGitLabMrPage(
      createGitLabMrFixtureHost({
        href: 'https://gitlab.com/group/project/-/merge_requests/42',
        html: emptyDiscussionsHtml,
      }),
    );
    const missingContainer = render(missingPage);
    await reconcile();

    expect(missingContainer.textContent).toContain(
      'Discussion list unavailable',
    );

    act(() => mountedRoot?.unmount());
    mountedRoot = null;
    const emptyContainer = render(emptyPage);
    await reconcile();

    expect(emptyContainer.textContent).not.toContain(
      'Discussion list unavailable',
    );
    expect(emptyContainer.textContent).not.toContain('My Threads');
  });

  it('hides discussions on MR subpages without parsing the URL in the caller', async () => {
    const host = createGitLabMrFixtureHost({
      href: 'https://gitlab.com/group/project/-/merge_requests/42/commits',
      html: discussionHtml,
    });
    const page = createGitLabMrPage(host);
    const container = render(page);

    await reconcile();

    expect(container.textContent).not.toContain('My Threads');
  });
});

function render(page: ReturnType<typeof createGitLabMrPage>): HTMLElement {
  const { document, window } = parseHTML('<html><body></body></html>');
  const globals = globalThis as Record<string, unknown>;
  const previous = { document: globals.document, window: globals.window };
  globals.document = document;
  globals.window = window;
  window.HTMLElement.prototype.scrollIntoView = () => {};
  restoreDom = () => Object.assign(globals, previous);
  (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
  act(() => {
    mountedRoot = createRoot(document.body);
    mountedRoot.render(
      <GitLabMrPageProvider value={page}>
        <ThreadList container={document.body} userId="100" />
      </GitLabMrPageProvider>,
    );
  });
  return document.body;
}

async function reconcile(): Promise<void> {
  await act(async () => {
    await new Promise<void>((resolve) => queueMicrotask(resolve));
  });
}
