import { CheckCircle2Icon, MessageSquareIcon, XCircleIcon } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { GITLAB_HIGHLIGHTED_THREAD_CLASS } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface ThreadReply {
  authorName: string;
  authorAvatar: string;
  authorUrl: string;
  timestamp: string;
  timeAgo: string;
  text: string;
  isCurrentUser: boolean;
}

interface Thread {
  id: string;
  resolved: boolean;
  replies: ThreadReply[];
}

interface ThreadListProps {
  container: HTMLElement | null;
  userId: string;
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

export const ThreadList = ({ container, userId }: ThreadListProps) => {
  const { pathname } = useUrlChange();
  const isMergeRequestRoot = /^.+\/-\/merge_requests\/\d+$/.test(pathname);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(
    new Set(),
  );
  const threadsRef = useRef<Thread[]>([]);
  // Ref map for each thread li — used to scroll active item into view in the popover
  const itemRefs = useRef<Map<string, HTMLLIElement>>(new Map());

  const collectThreads = useCallback(() => {
    const discussions = document.querySelectorAll(
      `.discussion[data-testid="discussion-content"]`,
    );
    const newUserThreads: Thread[] = [];
    discussions.forEach((el) => {
      const discussion = el as HTMLElement;
      const author = discussion.querySelector(
        `a.author-name-link[data-user-id="${userId}"]`,
      );
      if (author) {
        newUserThreads.push({
          id: discussion.dataset.discussionId ?? '',
          replies: extractReplies(discussion, userId),
          resolved: discussion.dataset.discussionResolved === 'true',
        });
      }
    });
    const isDifferent =
      JSON.stringify(newUserThreads) !== JSON.stringify(threadsRef.current);
    if (isDifferent) {
      threadsRef.current = newUserThreads;
      setThreads(newUserThreads);
    }
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

  if (threads.length === 0 || !isMergeRequestRoot) return null;

  const resolvedCount = threads.filter((t) => t.resolved).length;
  const unresolvedCount = threads.length - resolvedCount;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setOpen((prev) => !prev)}
          className="rounded-full shadow-sm gap-1.5 h-auto py-1.5"
        >
          <MessageSquareIcon className="h-3.5 w-3.5 shrink-0" />
          <div className="flex flex-col items-start leading-tight">
            <span className="text-xs">My Threads</span>
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
          <span className="text-sm font-medium">My Threads</span>
          <div className="ml-auto flex items-center gap-1.5">
            {unresolvedCount > 0 && (
              <span className="text-[10px] font-medium bg-destructive/10 text-destructive px-1.5 py-0.5 rounded-full">
                {unresolvedCount} open
              </span>
            )}
            {resolvedCount > 0 && (
              <span className="text-[10px] font-medium bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
                {resolvedCount} resolved
              </span>
            )}
          </div>
        </div>

        {/* Thread list */}
        <ul className="py-1 max-h-[420px] overflow-y-auto divide-y divide-border/40">
          {threads.map((thread, index) => {
            const isExpanded = expandedReplies.has(thread.id);
            const replyCount = thread.replies.length;
            const lastReply = thread.replies[thread.replies.length - 1];
            const hasUnreadReply =
              !thread.resolved && lastReply && !lastReply.isCurrentUser;

            return (
              <li
                key={thread.id}
                ref={(el) => {
                  if (el) itemRefs.current.set(thread.id, el);
                  else itemRefs.current.delete(thread.id);
                }}
              >
                {/* Thread row — div to avoid button-in-button.
                    Left area scrolls to discussion, right area toggles replies. */}
                <div
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2 transition-colors',
                    index === activeIndex ? 'bg-muted' : 'hover:bg-muted/60',
                  )}
                >
                  {/* Clickable left area — scroll to discussion */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => scrollToDiscussion(thread.id, index)}
                    onKeyDown={(e) =>
                      e.key === 'Enter' && scrollToDiscussion(thread.id, index)
                    }
                    className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer"
                  >
                    {thread.resolved ? (
                      <CheckCircle2Icon className="h-4 w-4 shrink-0 text-green-500" />
                    ) : (
                      <XCircleIcon className="h-4 w-4 shrink-0 text-destructive" />
                    )}
                    <span
                      className={cn(
                        'text-xs flex-1 truncate',
                        thread.resolved
                          ? 'text-muted-foreground line-through'
                          : 'text-foreground font-medium',
                      )}
                    >
                      Thread {index + 1}
                    </span>
                  </div>

                  {/* Right side — unread dot + reply toggle + viewing label */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {hasUnreadReply && (
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                    )}
                    {replyCount > 0 && (
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => toggleReplies(thread.id)}
                        onKeyDown={(e) =>
                          e.key === 'Enter' && toggleReplies(thread.id)
                        }
                        className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors px-1.5 py-0.5 rounded hover:bg-muted cursor-pointer"
                      >
                        <MessageSquareIcon className="h-3 w-3" />
                        {replyCount}
                      </div>
                    )}
                    {index === activeIndex && (
                      <span className="text-[10px] text-muted-foreground">
                        viewing
                      </span>
                    )}
                  </div>
                </div>

                {/* Replies — 1 level deep */}
                {isExpanded && replyCount > 0 && (
                  <ul className="border-t border-border/40 bg-muted/20">
                    {thread.replies.map((reply, rIndex) => (
                      <li
                        key={rIndex}
                        role="button"
                        tabIndex={0}
                        onClick={() => scrollToDiscussion(thread.id, index)}
                        onKeyDown={(e) =>
                          e.key === 'Enter' &&
                          scrollToDiscussion(thread.id, index)
                        }
                        className="flex items-start gap-2 px-4 py-2 border-b border-border/30 last:border-0 cursor-pointer hover:bg-muted/40 transition-colors"
                      >
                        {reply.authorAvatar ? (
                          <img
                            src={reply.authorAvatar}
                            alt={reply.authorName}
                            className="h-5 w-5 rounded-full shrink-0 mt-0.5"
                          />
                        ) : (
                          <div className="h-5 w-5 rounded-full bg-muted shrink-0 mt-0.5" />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline gap-1.5 mb-0.5">
                            <span
                              className={cn(
                                'text-[11px] font-medium truncate',
                                reply.isCurrentUser
                                  ? 'text-foreground'
                                  : 'text-muted-foreground',
                              )}
                            >
                              {reply.isCurrentUser ? 'You' : reply.authorName}
                            </span>
                            <span className="text-[10px] text-muted-foreground/60 shrink-0">
                              {reply.timeAgo}
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                            {reply.text}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </PopoverContent>
    </Popover>
  );
};
