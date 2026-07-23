import { parseHTML } from 'linkedom';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';

import { createGitLabMrPage } from '@/lib/gitlab-mr-page/gitlabMrPage';
import {
  GitLabMrPageProvider,
  useGitLabMrPageSnapshot,
} from '@/lib/gitlab-mr-page/gitlabMrPageReact';
import { createGitLabMrFixtureHost } from '@/lib/gitlab-mr-page/testing/createGitLabMrFixtureHost';
import overviewHtml from '@/lib/gitlab-mr-page/testing/fixtures/mr-overview.html?raw';

const mergeRequestHref = 'https://gitlab.com/group/project/-/merge_requests/42';

describe('GitLabMrPage React adapter', () => {
  let root: ReturnType<typeof createRoot> | null = null;
  let restoreDom: (() => void) | null = null;

  afterEach(() => {
    root?.unmount();
    root = null;
    restoreDom?.();
    restoreDom = null;
  });

  it('renders the synchronous loading snapshot and updates after publication', async () => {
    const host = createGitLabMrFixtureHost({
      href: mergeRequestHref,
      html: overviewHtml,
    });
    const page = createGitLabMrPage(host);
    const dom = installDom();
    const container = dom.container;
    restoreDom = dom.restore;
    const snapshots: string[] = [];

    function Consumer() {
      const snapshot = useGitLabMrPageSnapshot();
      snapshots.push(snapshot.status);
      return <output>{snapshot.status}</output>;
    }

    (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
    act(() => {
      root = createRoot(container);
      root.render(
        <GitLabMrPageProvider value={page}>
          <Consumer />
        </GitLabMrPageProvider>,
      );
    });

    expect(container.textContent).toBe('loading');
    expect(snapshots).toEqual(['loading']);

    await act(async () => {
      await flushReconciliation();
    });

    expect(container.textContent).toBe('ready');
    expect(snapshots).toEqual(['loading', 'ready']);

    await act(async () => {
      host.emitNavigation();
      await flushReconciliation();
    });

    expect(snapshots).toEqual(['loading', 'ready']);
  });
});

function installDom(): { container: HTMLElement; restore: () => void } {
  const { document, window } = parseHTML('<html><body></body></html>');
  const globals = globalThis as Record<string, unknown>;
  const previous = {
    document: globals.document,
    navigator: globals.navigator,
    window: globals.window,
  };

  globals.document = document;
  globals.navigator = window.navigator;
  globals.window = window;
  return {
    container: document.body,
    restore: () => Object.assign(globals, previous),
  };
}

async function flushReconciliation(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}
