export type GitLabMrPageStatus =
  | 'disposed'
  | 'inactive'
  | 'loading'
  | 'ready'
  | 'unavailable';

export interface GitLabMrIdentity {
  readonly href: string;
  readonly projectPath: string;
  readonly mergeRequestIid: string;
  readonly page: 'overview' | 'subpage';
}

export interface GitLabMrReply {
  readonly authorAvatar: string | null;
  readonly authorId: string | null;
  readonly authorName: string | null;
  readonly authorUrl: string | null;
  readonly text: string | null;
  readonly timeAgo: string | null;
  readonly timestamp: string | null;
}

declare const discussionRefBrand: unique symbol;

export interface DiscussionRef {
  readonly [discussionRefBrand]: true;
}

export interface GitLabMrDiscussion {
  readonly ref: DiscussionRef | null;
  readonly replies: readonly GitLabMrReply[];
  readonly resolved: boolean;
}

export interface GitLabMrPageFacts {
  readonly assigneeIds: readonly string[] | null;
  readonly authorId: string | null;
  readonly description: string | null;
  readonly discussions: readonly GitLabMrDiscussion[] | null;
  readonly hostAppearance: 'dark' | 'light' | null;
  readonly sourceBranch: string | null;
  readonly targetBranch: string | null;
  readonly title: string | null;
}

export interface GitLabMrInactiveSnapshot {
  readonly status: 'inactive';
}

export interface GitLabMrLoadingSnapshot {
  readonly identity: GitLabMrIdentity;
  readonly status: 'loading';
}

export interface GitLabMrReadySnapshot extends GitLabMrPageFacts {
  readonly identity: GitLabMrIdentity;
  readonly freshness: 'current' | 'stale';
  readonly status: 'ready';
}

export type GitLabMrPageSnapshot =
  | Readonly<GitLabMrInactiveSnapshot>
  | Readonly<GitLabMrLoadingSnapshot>
  | Readonly<GitLabMrReadySnapshot>
  | Readonly<GitLabMrUnavailableSnapshot>
  | Readonly<GitLabMrDisposedSnapshot>;

export interface GitLabMrUnavailableSnapshot {
  readonly identity: GitLabMrIdentity;
  readonly status: 'unavailable';
}

export interface GitLabMrDisposedSnapshot {
  readonly status: 'disposed';
}

export type GitLabMrDiscussionRevealResult =
  | { readonly status: 'revealed' }
  | { readonly status: 'discussion-missing' }
  | { readonly status: 'foreign-reference' }
  | { readonly status: 'stale-reference' }
  | { readonly status: 'page-unavailable' }
  | { readonly status: 'disposed' };

export type GitLabMrPageListener = () => void;

export interface GitLabMrPage {
  dispose(): void;
  getSnapshot(): GitLabMrPageSnapshot;
  revealDiscussion(ref: DiscussionRef): GitLabMrDiscussionRevealResult;
  subscribe(listener: GitLabMrPageListener): () => void;
}
