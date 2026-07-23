import { GITLAB_HIGHLIGHTED_THREAD_CLASS } from '@/lib/constants';
import type { GitLabMrHost } from '@/lib/gitlab-mr-page/gitlabMrHost';
import type {
  DiscussionRef,
  GitLabMrDiscussion,
  GitLabMrDiscussionRevealResult,
  GitLabMrIdentity,
  GitLabMrPage,
  GitLabMrPageFacts,
  GitLabMrPageListener,
  GitLabMrPageSnapshot,
  GitLabMrReply,
} from '@/lib/gitlab-mr-page/gitlabMrPage.types';

const MERGE_REQUEST_ROUTE = /^\/(.+)\/-\/merge_requests\/(\d+)(?:\/(.*))?\/?$/;
const AUTHOR_SELECTORS = [
  '[data-testid="issuable-authored-by"] a[data-user-id]',
  '.issuable-meta a.author-link[data-user-id]',
  '.issuable-meta a.author-name-link[data-user-id]',
  '.detail-page-header a.author-name-link[data-user-id]',
  '.merge-request-details a.author-name-link[data-user-id]',
];

interface DiscussionRefDetails {
  discussionId: string;
  epoch: number;
  owner: object;
}

export function createGitLabMrPage(host: GitLabMrHost): GitLabMrPage {
  const initialIdentity = parseIdentity(host.getHref());
  let snapshot: GitLabMrPageSnapshot = initialIdentity
    ? createLoadingSnapshot(initialIdentity, readHostAppearance(host))
    : createInactiveSnapshot();
  let epoch = initialIdentity ? 1 : 0;
  let scheduledEpoch: number | null = null;
  let disposed = false;
  let highlightedDiscussion: Element | null = null;
  let highlightTimer: ReturnType<typeof setTimeout> | null = null;
  const listeners = new Set<GitLabMrPageListener>();
  const owner = {};
  const discussionRefs = new Map<string, DiscussionRef>();
  const discussionRefDetails = new WeakMap<
    DiscussionRef,
    DiscussionRefDetails
  >();
  const mutationObserver = host.observeMutations(
    host.getDocument(),
    {
      attributes: true,
      attributeOldValue: true,
      characterData: true,
      childList: true,
      subtree: true,
    },
    handleMutation,
  );
  const removeNavigationListener = host.onNavigation(handleNavigation);

  if (initialIdentity) scheduleReconciliation(epoch);

  return {
    dispose,
    getSnapshot: () => snapshot,
    revealDiscussion,
    subscribe(listener) {
      if (disposed) return () => {};
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };

  function dispose(): void {
    if (disposed) return;
    disposed = true;
    mutationObserver.disconnect();
    removeNavigationListener();
    clearHighlight();
    commit(createDisposedSnapshot());
    listeners.clear();
  }

  function handleNavigation(): void {
    if (disposed) return;
    const currentIdentity = parseIdentity(host.getHref());
    const snapshotIdentity = getSnapshotIdentity(snapshot);

    if (!currentIdentity) {
      if (snapshot.status !== 'inactive') {
        epoch += 1;
        discussionRefs.clear();
        clearHighlight();
        commit(createInactiveSnapshot());
      }
      return;
    }

    if (!snapshotIdentity || !sameRoute(snapshotIdentity, currentIdentity)) {
      epoch += 1;
      discussionRefs.clear();
      clearHighlight();
      commit(createLoadingSnapshot(currentIdentity, readHostAppearance(host)));
      return;
    }

    scheduleReconciliation(epoch);
  }

  function handleMutation(records: MutationRecord[]): void {
    if (disposed) return;
    if (records.length > 0 && records.every(isHighlightMutation)) return;
    const currentIdentity = parseIdentity(host.getHref());
    const snapshotIdentity = getSnapshotIdentity(snapshot);
    if (
      !currentIdentity ||
      !snapshotIdentity ||
      !sameRoute(snapshotIdentity, currentIdentity)
    ) {
      handleNavigation();
      return;
    }

    if (snapshot.status === 'ready' && snapshot.freshness === 'current') {
      commit(createReadySnapshot(snapshot.identity, snapshot, 'stale'));
    }
    scheduleReconciliation(epoch);
  }

  function scheduleReconciliation(nextEpoch: number): void {
    if (disposed || scheduledEpoch === nextEpoch) return;
    scheduledEpoch = nextEpoch;
    queueMicrotask(() => {
      if (scheduledEpoch === nextEpoch) scheduledEpoch = null;
      reconcile(nextEpoch);
    });
  }

  function reconcile(reconciliationEpoch: number): void {
    if (disposed || reconciliationEpoch !== epoch) return;
    const currentIdentity = parseIdentity(host.getHref());
    const snapshotIdentity = getSnapshotIdentity(snapshot);
    if (
      !currentIdentity ||
      !snapshotIdentity ||
      !sameRoute(snapshotIdentity, currentIdentity)
    ) {
      handleNavigation();
      return;
    }

    try {
      const nextSnapshot = createReadySnapshot(
        currentIdentity,
        readFacts(
          host,
          owner,
          reconciliationEpoch,
          discussionRefs,
          discussionRefDetails,
        ),
        'current',
      );
      commitIfChanged(nextSnapshot);
    } catch {
      if (snapshot.status === 'ready') {
        if (snapshot.freshness === 'current') {
          commit(createReadySnapshot(snapshot.identity, snapshot, 'stale'));
        }
        return;
      }
      commit(createUnavailableSnapshot(currentIdentity));
    }
  }

  function revealDiscussion(
    ref: DiscussionRef,
  ): GitLabMrDiscussionRevealResult {
    if (disposed) return { status: 'disposed' };
    const details = discussionRefDetails.get(ref);
    if (!details || details.owner !== owner)
      return { status: 'foreign-reference' };
    if (details.epoch !== epoch) return { status: 'stale-reference' };
    if (snapshot.status !== 'ready') return { status: 'page-unavailable' };

    let discussion: Element | undefined;
    try {
      discussion = Array.from(
        host.getDocument().querySelectorAll('[data-discussion-id]'),
      ).find(
        (element) =>
          element.getAttribute('data-discussion-id') === details.discussionId,
      );
    } catch {
      return { status: 'page-unavailable' };
    }
    if (!discussion) return { status: 'discussion-missing' };

    host.scrollIntoView(discussion, { behavior: 'smooth', block: 'center' });
    clearHighlight();
    highlightedDiscussion = discussion;
    discussion.classList.add(GITLAB_HIGHLIGHTED_THREAD_CLASS);
    highlightTimer = setTimeout(clearHighlight, 1500);
    return { status: 'revealed' };
  }

  function clearHighlight(): void {
    if (highlightTimer) clearTimeout(highlightTimer);
    highlightTimer = null;
    highlightedDiscussion?.classList.remove(GITLAB_HIGHLIGHTED_THREAD_CLASS);
    highlightedDiscussion = null;
  }

  function commitIfChanged(nextSnapshot: GitLabMrPageSnapshot): void {
    if (!areSnapshotsEqual(snapshot, nextSnapshot)) commit(nextSnapshot);
  }

  function commit(nextSnapshot: GitLabMrPageSnapshot): void {
    snapshot = nextSnapshot;
    for (const listener of listeners) listener();
  }
}

function isHighlightMutation(record: MutationRecord): boolean {
  if (record.type !== 'attributes' || record.attributeName !== 'class') {
    return false;
  }

  const target = record.target as Element;
  return (
    target.classList.contains(GITLAB_HIGHLIGHTED_THREAD_CLASS) ||
    record.oldValue?.split(/\s+/).includes(GITLAB_HIGHLIGHTED_THREAD_CLASS) ===
      true
  );
}

function parseIdentity(href: string): GitLabMrIdentity | null {
  try {
    const url = new URL(href);
    if (url.hostname !== 'gitlab.com' && !url.hostname.endsWith('.gitlab.com'))
      return null;
    const match = url.pathname.match(MERGE_REQUEST_ROUTE);
    if (!match) return null;
    const [, projectPath, mergeRequestIid, subpage] = match;
    return {
      href: url.href,
      mergeRequestIid,
      page: subpage ? 'subpage' : 'overview',
      projectPath,
    };
  } catch {
    return null;
  }
}

function readFacts(
  host: GitLabMrHost,
  owner: object,
  epoch: number,
  discussionRefs: Map<string, DiscussionRef>,
  discussionRefDetails: WeakMap<DiscussionRef, DiscussionRefDetails>,
): GitLabMrPageFacts {
  const document = host.getDocument();
  const notesList = document.querySelector('#notes-list');
  const assignees = document.querySelector('[data-testid="assignees-widget"]');
  return {
    assigneeIds: assignees
      ? Array.from(assignees.querySelectorAll('[data-user-id]'))
          .map((element) => element.getAttribute('data-user-id'))
          .filter((id): id is string => id !== null)
      : null,
    authorId: readAuthorId(document),
    description: readDescription(document),
    discussions: notesList
      ? Array.from(
          notesList.querySelectorAll<HTMLElement>(
            '.discussion[data-testid="discussion-content"]',
          ),
          (discussion) =>
            readDiscussion(
              discussion,
              owner,
              epoch,
              discussionRefs,
              discussionRefDetails,
            ),
        )
      : null,
    hostAppearance: readHostAppearance(host),
    sourceBranch: readAttribute(
      document.querySelector('.js-source-branch-copy'),
      'data-clipboard-text',
    ),
    targetBranch: readTargetBranch(document),
    title: readText(document.querySelector('[data-testid="title-content"]')),
  };
}

function readAuthorId(document: Document): string | null {
  return readAttribute(
    document.querySelector(AUTHOR_SELECTORS.join(', ')),
    'data-user-id',
  );
}
function readHostAppearance(host: GitLabMrHost): 'dark' | 'light' | null {
  try {
    return host.getDocument().documentElement.classList.contains('gl-dark')
      ? 'dark'
      : 'light';
  } catch {
    return null;
  }
}
function readDescription(document: Document): string | null {
  const description = document.querySelector(
    '[data-testid="description-content"]',
  );
  if (!description) return null;
  const renderedDescription = readText(description);
  if (renderedDescription !== '') return renderedDescription;
  return (
    readAttribute(
      description.querySelector('.js-task-list-field'),
      'data-value',
    ) ?? renderedDescription
  );
}
function readTargetBranch(document: Document): string | null {
  const widgetTarget = document.querySelector(
    '[data-testid="widget-target-branch"]',
  );
  if (widgetTarget) return readText(widgetTarget);
  const refs = document.querySelectorAll<HTMLAnchorElement>('.ref-container');
  return refs.length > 1 ? readAttribute(refs[1], 'title') : null;
}
function readDiscussion(
  discussion: HTMLElement,
  owner: object,
  epoch: number,
  discussionRefs: Map<string, DiscussionRef>,
  discussionRefDetails: WeakMap<DiscussionRef, DiscussionRefDetails>,
): GitLabMrDiscussion {
  const id = readAttribute(discussion, 'data-discussion-id');
  return {
    ref: id
      ? getDiscussionRef(id, owner, epoch, discussionRefs, discussionRefDetails)
      : null,
    replies: Array.from(
      discussion.querySelectorAll<HTMLElement>(
        'li[data-testid="noteable-note-container"]',
      ),
      readReply,
    ),
    resolved: readAttribute(discussion, 'data-discussion-resolved') === 'true',
  };
}
function getDiscussionRef(
  discussionId: string,
  owner: object,
  epoch: number,
  discussionRefs: Map<string, DiscussionRef>,
  discussionRefDetails: WeakMap<DiscussionRef, DiscussionRefDetails>,
): DiscussionRef {
  const key = `${epoch}:${discussionId}`;
  const existingRef = discussionRefs.get(key);
  if (existingRef) return existingRef;
  const ref = Object.freeze({}) as DiscussionRef;
  discussionRefs.set(key, ref);
  discussionRefDetails.set(ref, { discussionId, epoch, owner });
  return ref;
}
function readReply(note: HTMLElement): GitLabMrReply {
  const authorLink = note.querySelector('.timeline-avatar a.gl-avatar-link');
  const avatar = note.querySelector<HTMLImageElement>(
    '.timeline-avatar img.gl-avatar',
  );
  const time = note.querySelector('time');
  return {
    authorAvatar: readAttribute(avatar, 'src'),
    authorId: readAttribute(authorLink, 'data-user-id'),
    authorName: readText(note.querySelector('[data-testid="author-name"]')),
    authorUrl: readAttribute(authorLink, 'href'),
    text: readText(note.querySelector('.note-text.md p')),
    timeAgo: readText(time),
    timestamp: readAttribute(time, 'datetime'),
  };
}
function readText(element: Element | null): string | null {
  return element ? (element.textContent?.trim() ?? '') : null;
}
function readAttribute(element: Element | null, name: string): string | null {
  return element ? (element.getAttribute(name) ?? '') : null;
}
function createInactiveSnapshot(): GitLabMrPageSnapshot {
  return deepFreeze({ status: 'inactive' });
}
function createLoadingSnapshot(
  identity: GitLabMrIdentity,
  hostAppearance: 'dark' | 'light' | null,
): GitLabMrPageSnapshot {
  return deepFreeze({ hostAppearance, identity, status: 'loading' });
}
function createUnavailableSnapshot(
  identity: GitLabMrIdentity,
): GitLabMrPageSnapshot {
  return deepFreeze({ identity, status: 'unavailable' });
}
function createDisposedSnapshot(): GitLabMrPageSnapshot {
  return deepFreeze({ status: 'disposed' });
}
function createReadySnapshot(
  identity: GitLabMrIdentity,
  facts: GitLabMrPageFacts,
  freshness: 'current' | 'stale',
): GitLabMrPageSnapshot {
  return deepFreeze({ ...facts, freshness, identity, status: 'ready' });
}
function getSnapshotIdentity(
  value: GitLabMrPageSnapshot,
): GitLabMrIdentity | null {
  return 'identity' in value ? value.identity : null;
}
function sameRoute(first: GitLabMrIdentity, second: GitLabMrIdentity): boolean {
  return (
    first.mergeRequestIid === second.mergeRequestIid &&
    first.page === second.page &&
    first.projectPath === second.projectPath
  );
}
function areSnapshotsEqual(
  first: GitLabMrPageSnapshot,
  second: GitLabMrPageSnapshot,
): boolean {
  return JSON.stringify(first) === JSON.stringify(second);
}
function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object') {
    for (const nestedValue of Object.values(value)) deepFreeze(nestedValue);
    Object.freeze(value);
  }
  return value;
}
