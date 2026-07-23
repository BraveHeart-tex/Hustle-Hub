import type { GitLabMrHost } from '@/lib/gitlab-mr-page/gitlabMrHost';
import type {
  DiscussionRef,
  GitLabMrDiscussion,
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

export function createGitLabMrPage(host: GitLabMrHost): GitLabMrPage {
  const initialIdentity = parseIdentity(host.getHref());
  let snapshot = initialIdentity
    ? createLoadingSnapshot(initialIdentity)
    : createInactiveSnapshot();
  const listeners = new Set<GitLabMrPageListener>();
  const discussionRefDetails = new WeakMap<
    DiscussionRef,
    DiscussionRefDetails
  >();
  const discussionRefs = new Map<string, DiscussionRef>();
  const owner = {};
  const mutationObserver = host.observeMutations(
    host.getDocument(),
    { attributes: true, characterData: true, childList: true, subtree: true },
    () => {
      if (initialIdentity) queueMicrotask(() => reconcile(initialIdentity));
    },
  );
  let disposed = false;

  if (initialIdentity) {
    queueMicrotask(() => reconcile(initialIdentity));
  }

  return {
    dispose: () => {
      disposed = true;
      mutationObserver.disconnect();
      listeners.clear();
    },
    getSnapshot: () => snapshot,
    subscribe: (listener) => {
      if (disposed) return () => {};

      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };

  function reconcile(identity: GitLabMrIdentity): void {
    if (disposed) return;

    const currentIdentity = parseIdentity(host.getHref());
    if (!currentIdentity || !sameIdentity(currentIdentity, identity)) return;

    const nextSnapshot = createReadySnapshot(
      currentIdentity,
      readFacts(host, owner, discussionRefs, discussionRefDetails),
    );
    if (areSnapshotsEqual(snapshot, nextSnapshot)) return;

    snapshot = nextSnapshot;
    for (const listener of listeners) {
      listener();
    }
  }
}

function parseIdentity(href: string): GitLabMrIdentity | null {
  let url: URL;

  try {
    url = new URL(href);
  } catch {
    return null;
  }

  if (url.hostname !== 'gitlab.com' && !url.hostname.endsWith('.gitlab.com')) {
    return null;
  }

  const match = url.pathname.match(MERGE_REQUEST_ROUTE);
  if (!match) return null;

  const [, projectPath, mergeRequestIid, subpage] = match;
  return {
    href: url.href,
    mergeRequestIid,
    page: subpage ? 'subpage' : 'overview',
    projectPath,
  };
}

function readFacts(
  host: GitLabMrHost,
  owner: object,
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
              discussionRefs,
              discussionRefDetails,
            ),
        )
      : null,
    hostAppearance: document.documentElement.classList.contains('gl-dark')
      ? 'dark'
      : 'light',
    sourceBranch: readAttribute(
      document.querySelector('.js-source-branch-copy'),
      'data-clipboard-text',
    ),
    targetBranch: readTargetBranch(document),
    title: readText(document.querySelector('[data-testid="title-content"]')),
  };
}

function readAuthorId(document: Document): string | null {
  const author = document.querySelector(AUTHOR_SELECTORS.join(', '));
  return readAttribute(author, 'data-user-id');
}

function readDescription(document: Document): string | null {
  const description = document.querySelector(
    '[data-testid="description-content"]',
  );
  if (!description) return null;

  const renderedDescription = readText(description);
  if (renderedDescription !== '') {
    return renderedDescription;
  }

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
  discussionRefs: Map<string, DiscussionRef>,
  discussionRefDetails: WeakMap<DiscussionRef, DiscussionRefDetails>,
): GitLabMrDiscussion {
  const id = readAttribute(discussion, 'data-discussion-id');

  return {
    ref: id
      ? getDiscussionRef(id, owner, discussionRefs, discussionRefDetails)
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

interface DiscussionRefDetails {
  discussionId: string;
  epoch: number;
  owner: object;
}

function getDiscussionRef(
  discussionId: string,
  owner: object,
  discussionRefs: Map<string, DiscussionRef>,
  discussionRefDetails: WeakMap<DiscussionRef, DiscussionRefDetails>,
): DiscussionRef {
  const existingRef = discussionRefs.get(discussionId);
  if (existingRef) return existingRef;

  const ref = Object.freeze({}) as DiscussionRef;
  discussionRefs.set(discussionId, ref);
  discussionRefDetails.set(ref, { discussionId, epoch: 0, owner });
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
): GitLabMrPageSnapshot {
  return deepFreeze({ identity, status: 'loading' });
}

function createReadySnapshot(
  identity: GitLabMrIdentity,
  facts: GitLabMrPageFacts,
): GitLabMrPageSnapshot {
  return deepFreeze({
    freshness: 'current',
    identity,
    status: 'ready',
    ...facts,
  });
}

function sameIdentity(
  first: GitLabMrIdentity,
  second: GitLabMrIdentity,
): boolean {
  return first.href === second.href;
}

function areSnapshotsEqual(
  first: GitLabMrPageSnapshot,
  second: GitLabMrPageSnapshot,
): boolean {
  return JSON.stringify(first) === JSON.stringify(second);
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object') {
    for (const nestedValue of Object.values(value)) {
      deepFreeze(nestedValue);
    }
    Object.freeze(value);
  }

  return value;
}
