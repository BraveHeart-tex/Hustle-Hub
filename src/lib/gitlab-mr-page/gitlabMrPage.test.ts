import { describe, expect, it, vi } from 'vitest';

import { createGitLabMrPage } from '@/lib/gitlab-mr-page/gitlabMrPage';
import { createGitLabMrFixtureHost } from '@/lib/gitlab-mr-page/testing/createGitLabMrFixtureHost';
import overviewHtml from '@/lib/gitlab-mr-page/testing/fixtures/mr-overview.html?raw';
import emptyDiscussionsHtml from '@/lib/gitlab-mr-page/testing/fixtures/mr-overview-empty-discussions.html?raw';
import missingRegionsHtml from '@/lib/gitlab-mr-page/testing/fixtures/mr-overview-missing-regions.html?raw';
import discussionsHtml from '@/lib/gitlab-mr-page/testing/fixtures/mr-overview-with-discussions.html?raw';
import secondMrHtml from '@/lib/gitlab-mr-page/testing/fixtures/second-mr-overview.html?raw';

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

  it('does not replace the cached current snapshot during an identical reconciliation', async () => {
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

    host.emitNavigation();
    await flushReconciliation();

    expect(page.getSnapshot()).toBe(readySnapshot);
    expect(listener).not.toHaveBeenCalled();
  });

  it('starts a new epoch without retaining facts when navigating to another MR', async () => {
    const host = createGitLabMrFixtureHost({
      href: mergeRequestHref,
      html: overviewHtml,
    });
    const page = createGitLabMrPage(host);
    await flushReconciliation();

    host.setHref('https://gitlab.com/group/project/-/merge_requests/43');
    host.emitNavigation();

    expect(page.getSnapshot()).toEqual({
      identity: {
        href: 'https://gitlab.com/group/project/-/merge_requests/43',
        mergeRequestIid: '43',
        page: 'overview',
        projectPath: 'group/project',
      },
      status: 'loading',
    });
    await flushReconciliation();
    expect(page.getSnapshot()).toMatchObject({ status: 'loading' });

    host.replaceDocument(secondMrHtml);
    host.emitMutation();
    await flushReconciliation();
    expect(page.getSnapshot()).toMatchObject({
      freshness: 'current',
      status: 'ready',
      title: 'Second merge request',
    });
  });

  it('rejects delayed reconciliation work from a previous epoch', async () => {
    const host = createGitLabMrFixtureHost({
      href: mergeRequestHref,
      html: overviewHtml,
    });
    const page = createGitLabMrPage(host);

    host.setHref('https://gitlab.com/group/project/-/merge_requests/43');
    host.emitNavigation();
    await flushReconciliation();

    expect(page.getSnapshot()).toMatchObject({ status: 'loading' });
    host.replaceDocument(secondMrHtml);
    host.emitMutation();
    await flushReconciliation();

    expect(page.getSnapshot()).toMatchObject({
      identity: { mergeRequestIid: '43' },
      status: 'ready',
      title: 'Second merge request',
    });
  });

  it('publishes inactive outside MR routes and invalidates old references', async () => {
    const host = createGitLabMrFixtureHost({
      href: mergeRequestHref,
      html: discussionsHtml,
    });
    const page = createGitLabMrPage(host);
    await flushReconciliation();
    const snapshot = page.getSnapshot();
    if (snapshot.status !== 'ready' || !snapshot.discussions?.[0]?.ref) return;

    host.setHref('https://gitlab.com/group/project/-/issues/42');
    host.emitNavigation();

    expect(page.getSnapshot()).toEqual({ status: 'inactive' });
    expect(page.revealDiscussion(snapshot.discussions[0].ref)).toEqual({
      status: 'stale-reference',
    });
  });

  it('creates a new epoch for overview-to-subpage navigation', async () => {
    const host = createGitLabMrFixtureHost({
      href: mergeRequestHref,
      html: overviewHtml,
    });
    const page = createGitLabMrPage(host);
    await flushReconciliation();

    host.setHref(`${mergeRequestHref}/commits`);
    host.emitNavigation();
    expect(page.getSnapshot()).toMatchObject({
      identity: { page: 'subpage' },
      status: 'loading',
    });
  });

  it('keeps its epoch for query-only changes while updating identity href', async () => {
    const host = createGitLabMrFixtureHost({
      href: mergeRequestHref,
      html: overviewHtml,
    });
    const page = createGitLabMrPage(host);
    await flushReconciliation();

    host.setHref(`${mergeRequestHref}?tab=activity`);
    host.emitNavigation();
    await flushReconciliation();

    expect(page.getSnapshot()).toMatchObject({
      identity: { href: `${mergeRequestHref}?tab=activity` },
      status: 'ready',
    });
  });

  it('publishes one stale state for coalesced mutations before becoming current', async () => {
    const host = createGitLabMrFixtureHost({
      href: mergeRequestHref,
      html: overviewHtml,
    });
    const page = createGitLabMrPage(host);
    await flushReconciliation();
    const listener = vi.fn();
    page.subscribe(listener);

    host.emitMutation();
    host.emitMutation();
    expect(page.getSnapshot()).toMatchObject({ freshness: 'stale' });
    expect(listener).toHaveBeenCalledOnce();
    await flushReconciliation();

    expect(page.getSnapshot()).toMatchObject({ freshness: 'current' });
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('publishes unavailable only when the first observation fails', async () => {
    const host = createGitLabMrFixtureHost({
      href: mergeRequestHref,
      html: overviewHtml,
    });
    const page = createGitLabMrPage(host);
    host.getDocument = () => {
      throw new Error('DOM unavailable');
    };

    await flushReconciliation();
    expect(page.getSnapshot()).toMatchObject({ status: 'unavailable' });
  });

  it('retains a stale same-epoch snapshot when a later observation fails', async () => {
    const host = createGitLabMrFixtureHost({
      href: mergeRequestHref,
      html: overviewHtml,
    });
    const page = createGitLabMrPage(host);
    await flushReconciliation();
    host.getDocument = () => {
      throw new Error('DOM unavailable');
    };

    host.emitMutation();
    await flushReconciliation();
    expect(page.getSnapshot()).toMatchObject({
      freshness: 'stale',
      status: 'ready',
      title: 'Example merge request',
    });
  });

  it('returns page-unavailable when revealing during a later DOM failure', async () => {
    const host = createGitLabMrFixtureHost({
      href: mergeRequestHref,
      html: discussionsHtml,
    });
    const page = createGitLabMrPage(host);
    await flushReconciliation();
    const snapshot = page.getSnapshot();
    if (snapshot.status !== 'ready' || !snapshot.discussions?.[0]?.ref) return;

    host.getDocument = () => {
      throw new Error('DOM unavailable');
    };
    host.emitMutation();
    await flushReconciliation();

    expect(page.revealDiscussion(snapshot.discussions[0].ref)).toEqual({
      status: 'page-unavailable',
    });
  });

  it('ignores mutation records created by the discussion highlight', async () => {
    const host = createGitLabMrFixtureHost({
      href: mergeRequestHref,
      html: discussionsHtml,
    });
    const page = createGitLabMrPage(host);
    await flushReconciliation();
    const snapshot = page.getSnapshot();
    if (snapshot.status !== 'ready' || !snapshot.discussions?.[0]?.ref) return;
    const listener = vi.fn();
    page.subscribe(listener);
    const discussion = host
      .getDocument()
      .querySelector('[data-discussion-id="discussion-1"]');
    if (!discussion) return;

    page.revealDiscussion(snapshot.discussions[0].ref);
    host.emitMutation([
      {
        attributeName: 'class',
        oldValue: '',
        target: discussion,
        type: 'attributes',
      } as unknown as MutationRecord,
    ]);
    await flushReconciliation();

    expect(page.getSnapshot()).toBe(snapshot);
    expect(listener).not.toHaveBeenCalled();
  });

  it('reveals current discussions and rejects missing, stale, and foreign references', async () => {
    const host = createGitLabMrFixtureHost({
      href: mergeRequestHref,
      html: discussionsHtml,
    });
    const page = createGitLabMrPage(host);
    const otherPage = createGitLabMrPage(
      createGitLabMrFixtureHost({
        href: mergeRequestHref,
        html: discussionsHtml,
      }),
    );
    await flushReconciliation();
    const snapshot = page.getSnapshot();
    const otherSnapshot = otherPage.getSnapshot();
    if (
      snapshot.status !== 'ready' ||
      otherSnapshot.status !== 'ready' ||
      !snapshot.discussions?.[0]?.ref ||
      !otherSnapshot.discussions?.[0]?.ref
    )
      return;

    const ref = snapshot.discussions[0].ref;
    expect(page.revealDiscussion(ref)).toEqual({ status: 'revealed' });
    expect(host.scrollRequests[0]?.element).toBe(
      host.getDocument().querySelector('[data-discussion-id="discussion-1"]'),
    );
    expect(
      host.scrollRequests[0]?.element.classList.contains(
        '__hb-gitlab-highlighted-thread',
      ),
    ).toBe(true);

    host.replaceDocument(overviewHtml);
    expect(page.revealDiscussion(ref)).toEqual({
      status: 'discussion-missing',
    });
    expect(page.revealDiscussion(otherSnapshot.discussions[0].ref)).toEqual({
      status: 'foreign-reference',
    });

    host.setHref('https://gitlab.com/group/project/-/merge_requests/43');
    host.emitNavigation();
    expect(page.revealDiscussion(ref)).toEqual({ status: 'stale-reference' });
  });

  it('disposes once, removes highlights, and makes later operations inert', async () => {
    const host = createGitLabMrFixtureHost({
      href: mergeRequestHref,
      html: discussionsHtml,
    });
    const page = createGitLabMrPage(host);
    const listener = vi.fn();
    page.subscribe(listener);
    await flushReconciliation();
    const snapshot = page.getSnapshot();
    if (snapshot.status !== 'ready' || !snapshot.discussions?.[0]?.ref) return;
    const highlighted = host
      .getDocument()
      .querySelector('[data-discussion-id="discussion-1"]');
    page.revealDiscussion(snapshot.discussions[0].ref);
    listener.mockClear();

    page.dispose();
    page.dispose();
    host.emitMutation();
    host.emitNavigation();
    await flushReconciliation();

    expect(page.getSnapshot()).toEqual({ status: 'disposed' });
    expect(listener).toHaveBeenCalledOnce();
    expect(
      highlighted?.classList.contains('__hb-gitlab-highlighted-thread'),
    ).toBe(false);
    expect(page.revealDiscussion(snapshot.discussions[0].ref)).toEqual({
      status: 'disposed',
    });
  });
});

async function flushReconciliation(): Promise<void> {
  await Promise.resolve();
}
