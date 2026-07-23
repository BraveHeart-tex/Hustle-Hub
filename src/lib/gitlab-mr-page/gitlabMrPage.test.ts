import { describe, expect, it, vi } from 'vitest';

import { createGitLabMrPage } from '@/lib/gitlab-mr-page/gitlabMrPage';
import { createGitLabMrFixtureHost } from '@/lib/gitlab-mr-page/testing/createGitLabMrFixtureHost';
import overviewHtml from '@/lib/gitlab-mr-page/testing/fixtures/mr-overview.html?raw';
import emptyDiscussionsHtml from '@/lib/gitlab-mr-page/testing/fixtures/mr-overview-empty-discussions.html?raw';
import missingRegionsHtml from '@/lib/gitlab-mr-page/testing/fixtures/mr-overview-missing-regions.html?raw';
import discussionsHtml from '@/lib/gitlab-mr-page/testing/fixtures/mr-overview-with-discussions.html?raw';

const mergeRequestHref = 'https://gitlab.com/group/project/-/merge_requests/42';

describe('createGitLabMrPage', () => {
  it('returns a stable inactive snapshot outside an MR route', () => {
    const page = createGitLabMrPage(
      createGitLabMrFixtureHost({
        href: 'https://gitlab.com/group/project/-/issues/42',
        html: overviewHtml,
      }),
    );

    expect(page.getSnapshot()).toEqual({ status: 'inactive' });
    expect(page.getSnapshot()).toBe(page.getSnapshot());
    expect(Object.isFrozen(page.getSnapshot())).toBe(true);
  });

  it('returns loading synchronously and reconciles to current facts', async () => {
    const page = createGitLabMrPage(
      createGitLabMrFixtureHost({ href: mergeRequestHref, html: overviewHtml }),
    );

    const initialSnapshot = page.getSnapshot();
    expect(initialSnapshot).toEqual({
      identity: {
        href: mergeRequestHref,
        mergeRequestIid: '42',
        page: 'overview',
        projectPath: 'group/project',
      },
      status: 'loading',
    });
    expect(page.getSnapshot()).toBe(initialSnapshot);

    await flushReconciliation();

    expect(page.getSnapshot()).toMatchObject({
      assigneeIds: ['100'],
      authorId: '100',
      description: 'FEREL-42',
      discussions: [],
      freshness: 'current',
      hostAppearance: 'dark',
      sourceBranch: 'feature/test',
      status: 'ready',
      targetBranch: 'main',
      title: 'Example merge request',
    });
    expect(page.getSnapshot()).toBe(page.getSnapshot());
  });

  it('deeply freezes snapshot facts while preserving null and empty values', async () => {
    const page = createGitLabMrPage(
      createGitLabMrFixtureHost({
        href: mergeRequestHref,
        html: discussionsHtml,
      }),
    );

    await flushReconciliation();

    const snapshot = page.getSnapshot();
    expect(snapshot.status).toBe('ready');
    if (snapshot.status !== 'ready') return;

    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(Object.isFrozen(snapshot.identity)).toBe(true);
    expect(Object.isFrozen(snapshot.assigneeIds)).toBe(true);
    expect(Object.isFrozen(snapshot.discussions)).toBe(true);
    expect(Object.isFrozen(snapshot.discussions?.[0])).toBe(true);
    expect(Object.isFrozen(snapshot.discussions?.[0]?.replies)).toBe(true);
    expect(Object.isFrozen(snapshot.discussions?.[0]?.replies[0])).toBe(true);
    expect(snapshot.discussions?.[0]?.ref).not.toHaveProperty('id');
    expect(snapshot.discussions?.[0]?.replies[1]?.authorAvatar).toBeNull();
    expect(snapshot.discussions?.[0]?.replies[1]?.authorId).toBeNull();
    expect(snapshot.discussions?.[0]?.replies[1]?.timestamp).toBeNull();
  });

  it('distinguishes missing regions from confirmed empty collections', async () => {
    const missingPage = createGitLabMrPage(
      createGitLabMrFixtureHost({
        href: mergeRequestHref,
        html: missingRegionsHtml,
      }),
    );
    const emptyPage = createGitLabMrPage(
      createGitLabMrFixtureHost({
        href: mergeRequestHref,
        html: emptyDiscussionsHtml,
      }),
    );

    await flushReconciliation();

    expect(missingPage.getSnapshot()).toMatchObject({
      assigneeIds: null,
      description: null,
      discussions: null,
      sourceBranch: null,
      status: 'ready',
      targetBranch: null,
    });
    expect(emptyPage.getSnapshot()).toMatchObject({ discussions: [] });
  });

  it('does not notify while subscribing and replaces state before notifying', async () => {
    const page = createGitLabMrPage(
      createGitLabMrFixtureHost({ href: mergeRequestHref, html: overviewHtml }),
    );
    const loadingSnapshot = page.getSnapshot();
    const listener = vi.fn(() => {
      expect(page.getSnapshot()).not.toBe(loadingSnapshot);
      expect(page.getSnapshot()).toMatchObject({ status: 'ready' });
    });
    const unsubscribe = page.subscribe(listener);

    expect(listener).not.toHaveBeenCalled();
    await flushReconciliation();
    expect(listener).toHaveBeenCalledOnce();

    unsubscribe();
    unsubscribe();
  });

  it('preserves a ready snapshot and does not notify for identical reconciliation', async () => {
    const host = createGitLabMrFixtureHost({
      href: mergeRequestHref,
      html: overviewHtml,
    });
    const page = createGitLabMrPage(host);
    const listener = vi.fn();
    page.subscribe(listener);

    await flushReconciliation();
    const readySnapshot = page.getSnapshot();
    listener.mockClear();

    host.emitMutation();
    await flushReconciliation();

    expect(page.getSnapshot()).toBe(readySnapshot);
    expect(listener).not.toHaveBeenCalled();
  });
});

async function flushReconciliation(): Promise<void> {
  await Promise.resolve();
}
