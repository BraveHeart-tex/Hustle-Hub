import { MessageSquareIcon } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  type Thread,
  type ThreadReply,
} from '@/components/mr-thread-panel/mr-thread-panel.types';
import { MrThreadItem } from '@/components/mr-thread-panel/MrThreadItem';
import { SEGMENT_CLASS } from '@/components/mr-thread-panel/segment';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useUrlChange } from '@/hooks/useUrlChange';
import { GITLAB_HIGHLIGHTED_THREAD_CLASS } from '@/lib/constants';

const MERGE_REQUEST_AUTHOR_SELECTORS = [
  '[data-testid="issuable-authored-by"] a[data-user-id]',
  '.issuable-meta a.author-link[data-user-id]',
  '.issuable-meta a.author-name-link[data-user-id]',
  '.detail-page-header a.author-name-link[data-user-id]',
  '.merge-request-details a.author-name-link[data-user-id]',
];

function getMergeRequestAuthorId(): string {
  const authorLinks = document.querySelectorAll<HTMLAnchorElement>(
    MERGE_REQUEST_AUTHOR_SELECTORS.join(', '),
  );

  for (const authorLink of authorLinks) {
    const authorId = authorLink.dataset.userId;
    if (authorId) {
      return authorId;
    }
  }

  const fallbackAuthorLink = Array.from(
    document.querySelectorAll<HTMLAnchorElement>(
      'a.author-name-link[data-user-id]',
    ),
  ).find((authorLink) => !authorLink.closest('.discussion'));

  return fallbackAuthorLink?.dataset.userId ?? '';
}

function isUserThread(discussion: HTMLElement, userId: string): boolean {
  const authorLinks = discussion.querySelectorAll<HTMLAnchorElement>(
    'a.author-name-link[data-user-id]',
  );

  for (const authorLink of authorLinks) {
    if (authorLink.dataset.userId === userId) {
      return true;
    }
  }

  return false;
}

function extractReplies(
  discussion: HTMLElement,
  userId: string,
): ThreadReply[] {
  const notes = discussion.querySelectorAll(
    'li[data-testid="noteable-note-container"]',
  );
  const replies: ThreadReply[] = [];

  notes.forEach((note) => {
    const avatarImg = note.querySelector<HTMLImageElement>(
      '.timeline-avatar img.gl-avatar',
    );
    const authorLink = note.querySelector<HTMLAnchorElement>(
      '.timeline-avatar a.gl-avatar-link',
    );
    const authorName = note.querySelector<HTMLElement>(
      'span[data-testid="author-name"]',
    );
    const timeEl = note.querySelector<HTMLTimeElement>('time');
    const textEl = note.querySelector<HTMLElement>('.note-text.md p');
    if (!authorName || !textEl) return;
    const noteAuthorId = authorLink?.dataset.userId ?? '';
    replies.push({
      authorAvatar: avatarImg?.src ?? '',
      authorName: authorName.textContent?.trim() ?? '',
      authorUrl: authorLink?.href ?? '',
      isCurrentUser: noteAuthorId === userId,
      text: textEl.textContent?.trim() ?? '',
      timeAgo: timeEl?.textContent?.trim() ?? '',
      timestamp: timeEl?.getAttribute('datetime') ?? '',
    });
  });

  return replies;
}

interface ThreadListProps {
  container: HTMLElement | null;
  userId: string;
}

export const ThreadList = ({ container, userId }: ThreadListProps) => {
  const { pathname } = useUrlChange();
  const isMergeRequestRoot = /^.+\/-\/merge_requests\/\d+$/.test(pathname);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(
    new Set(),
  );
  const [isOwnMergeRequest, setIsOwnMergeRequest] = useState(false);
  const threadsRef = useRef<Thread[]>([]);
  // Ref map for each thread li — used to scroll active item into view in the popover
  const itemRefs = useRef<Map<string, HTMLLIElement>>(new Map());

  const collectThreads = useCallback(() => {
    const mergeRequestAuthorId = getMergeRequestAuthorId();
    const shouldShowAllThreads = mergeRequestAuthorId === userId;
    const discussions = document.querySelectorAll(
      `.discussion[data-testid="discussion-content"]`,
    );

    const newThreads: Thread[] = [];

    discussions.forEach((el) => {
      const discussion = el as HTMLElement;

      if (!shouldShowAllThreads && !isUserThread(discussion, userId)) {
        return;
      }

      newThreads.push({
        id: discussion.dataset.discussionId ?? '',
        replies: extractReplies(discussion, userId),
        resolved: discussion.dataset.discussionResolved === 'true',
      });
    });

    const isDifferent =
      JSON.stringify(newThreads) !== JSON.stringify(threadsRef.current);

    if (isDifferent) {
      threadsRef.current = newThreads;
      setThreads(newThreads);
    }

    setIsOwnMergeRequest(shouldShowAllThreads);
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    collectThreads();
    let debounceTimer: NodeJS.Timeout;
    const observer = new MutationObserver(() => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(collectThreads, 300);
    });
    const targetNode = document.querySelector('#notes-list') ?? document.body;
    observer.observe(targetNode, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      clearTimeout(debounceTimer);
    };
  }, [userId, collectThreads]);

  const scrollToDiscussion = useCallback((id: string, index: number) => {
    // Scroll the page to the GitLab discussion
    const el = document.querySelector(
      `[data-discussion-id="${id}"]`,
    ) as HTMLElement | null;
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add(GITLAB_HIGHLIGHTED_THREAD_CLASS);
      setTimeout(
        () => el.classList.remove(GITLAB_HIGHLIGHTED_THREAD_CLASS),
        1500,
      );
    }

    // Scroll the clicked li into view inside the popover
    setActiveIndex(index);
    const listItem = itemRefs.current.get(id);
    listItem?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  const toggleReplies = useCallback((id: string) => {
    setExpandedReplies((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const setItemRef = useCallback((id: string, el: HTMLLIElement | null) => {
    if (el) itemRefs.current.set(id, el);
    else itemRefs.current.delete(id);
  }, []);

  if (threads.length === 0 || !isMergeRequestRoot) return null;

  const title = isOwnMergeRequest ? 'MR Threads' : 'My Threads';
  const resolvedCount = threads.filter((t) => t.resolved).length;
  const unresolvedCount = threads.length - resolvedCount;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setOpen((prev) => !prev)}
          className={SEGMENT_CLASS}
        >
          <MessageSquareIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <div className="flex flex-col items-start leading-tight">
            <span className="text-xs text-muted-foreground">{title}</span>
            <span className="text-[10px] text-muted-foreground font-medium">
              {unresolvedCount > 0 && `${unresolvedCount} open`}
              {unresolvedCount > 0 && resolvedCount > 0 && ' · '}
              {resolvedCount > 0 && `${resolvedCount} resolved`}
            </span>
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        container={container}
        side="top"
        align="end"
        className="w-80 p-0 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center gap-2 px-3 py-2.5 border-b bg-muted/40">
          <MessageSquareIcon className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-sm font-medium">{title}</span>
          <div className="ml-auto flex items-center gap-1.5">
            {unresolvedCount > 0 && (
              <span className="text-[10px] font-medium bg-destructive/10 text-destructive px-1.5 py-0.5 rounded-full">
                {unresolvedCount} open
              </span>
            )}
            {resolvedCount > 0 && (
              <span className="text-[10px] font-medium bg-success/10 text-success px-1.5 py-0.5 rounded-full">
                {resolvedCount} resolved
              </span>
            )}
          </div>
        </div>

        {/* Thread list */}
        <ul className="py-1 max-h-[420px] overflow-y-auto divide-y divide-border/40">
          {threads.map((thread, index) => (
            <MrThreadItem
              key={thread.id}
              active={index === activeIndex}
              expanded={expandedReplies.has(thread.id)}
              index={index}
              thread={thread}
              onScrollToDiscussion={scrollToDiscussion}
              onSetItemRef={setItemRef}
              onToggleReplies={toggleReplies}
            />
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
};
