import { describe, expect, it, vi } from 'vitest';

import type { GitLabMrHost } from '@/lib/gitlab-mr-page/gitlabMrHost';
import { createGitLabMrFixtureHost } from '@/lib/gitlab-mr-page/testing/createGitLabMrFixtureHost';
import overviewHtml from '@/lib/gitlab-mr-page/testing/fixtures/mr-overview-with-discussions.html?raw';
import secondMrOverviewHtml from '@/lib/gitlab-mr-page/testing/fixtures/second-mr-overview.html?raw';
describe('GitLab MR fixture environment', () => {
  it('supplies raw DOM and host signals without deriving page facts', () => {
    const host = createGitLabMrFixtureHost({
      href: 'https://gitlab.com/group/project/-/merge_requests/42',
      html: overviewHtml,
    });
    const productionHost: GitLabMrHost = host;
    const document = productionHost.getDocument();
    const discussion = document.querySelector<HTMLElement>(
      '.discussion[data-discussion-id="discussion-1"]',
    );

    expect(discussion?.classList.contains('discussion')).toBe(true);
    expect(discussion?.dataset.discussionResolved).toBe('false');
    expect(
      discussion?.querySelector('[data-testid="author-name"]')?.textContent,
    ).toBe('Ada Lovelace');
    expect(
      discussion?.querySelectorAll('[data-testid="noteable-note-container"]'),
    ).toHaveLength(2);

    const navigationListener = vi.fn();
    host.onNavigation(navigationListener);
    host.setHref('https://gitlab.com/group/project/-/merge_requests/43');

    expect(host.getHref()).toBe(
      'https://gitlab.com/group/project/-/merge_requests/42',
    );

    host.emitNavigation();

    expect(host.getHref()).toBe(
      'https://gitlab.com/group/project/-/merge_requests/43',
    );
    expect(navigationListener).toHaveBeenCalledOnce();

    const mutationListener = vi.fn();
    host.observeMutations(
      document.body,
      { childList: true, subtree: true },
      mutationListener,
    );

    expect(mutationListener).not.toHaveBeenCalled();
    host.emitMutation();
    expect(mutationListener).toHaveBeenCalledOnce();

    expect(discussion).not.toBeNull();
    host.scrollIntoView(discussion!, { block: 'center' });
    expect(host.scrollRequests).toEqual([
      { element: discussion, options: { block: 'center' } },
    ]);

    host.replaceDocument(secondMrOverviewHtml);
    expect(
      host.getDocument().querySelector('[data-testid="title-content"]')
        ?.textContent,
    ).toBe('Second merge request');
  });
});
