import { MessageSquareIcon } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';

import { MrThreadItem } from '@/components/mr-thread-panel/MrThreadItem';
import { SEGMENT_CLASS } from '@/components/mr-thread-panel/segment';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import type {
  DiscussionRef,
  GitLabMrDiscussion,
} from '@/lib/gitlab-mr-page/gitlabMrPage.types';
import {
  useGitLabMrPage,
  useGitLabMrPageSnapshot,
} from '@/lib/gitlab-mr-page/gitlabMrPageReact';

interface ThreadListProps {
  container: HTMLElement | null;
  userId: string;
}

export const ThreadList = ({ container, userId }: ThreadListProps) => {
  const page = useGitLabMrPage();
  const snapshot = useGitLabMrPageSnapshot();
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [expandedReplies, setExpandedReplies] = useState<Set<DiscussionRef>>(
    new Set(),
  );
  const itemRefs = useRef<Map<number, HTMLLIElement>>(new Map());
  const discussionKeys = useRef(new WeakMap<DiscussionRef, number>());
  const nextDiscussionKey = useRef(0);
  const facts = snapshot.status === 'ready' ? snapshot : null;
  const isOwnMergeRequest = facts?.authorId === userId;
  const discussions = getVisibleDiscussions(
    facts?.discussions ?? null,
    userId,
    isOwnMergeRequest,
  );
  const isMergeRequestRoot = facts?.identity.page === 'overview';

  const scrollToDiscussion = useCallback(
    (ref: DiscussionRef | null, index: number) => {
      if (ref) page.revealDiscussion(ref);

      setActiveIndex(index);
      itemRefs.current.get(index)?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    },
    [page],
  );

  const toggleReplies = useCallback((ref: DiscussionRef | null) => {
    if (!ref) return;
    setExpandedReplies((previous) => {
      const next = new Set(previous);
      if (next.has(ref)) next.delete(ref);
      else next.add(ref);
      return next;
    });
  }, []);

  const setItemRef = useCallback(
    (index: number, element: HTMLLIElement | null) => {
      if (element) itemRefs.current.set(index, element);
      else itemRefs.current.delete(index);
    },
    [],
  );

  if (!isMergeRequestRoot) return null;
  if (discussions === null) {
    return <span className="sr-only">Discussion list unavailable</span>;
  }
  if (discussions.length === 0) return null;

  const title = isOwnMergeRequest ? 'MR Threads' : 'My Threads';
  const resolvedCount = discussions.filter(
    (discussion) => discussion.resolved,
  ).length;
  const unresolvedCount = discussions.length - resolvedCount;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setOpen((previous) => !previous)}
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
        <ul className="py-1 max-h-[420px] overflow-y-auto divide-y divide-border/40">
          {discussions.map((discussion, index) => (
            <MrThreadItem
              key={getDiscussionKey(
                discussion.ref,
                index,
                discussionKeys.current,
                nextDiscussionKey,
              )}
              active={index === activeIndex}
              currentUserId={userId}
              discussion={discussion}
              expanded={
                discussion.ref ? expandedReplies.has(discussion.ref) : false
              }
              index={index}
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

function getVisibleDiscussions(
  discussions: readonly GitLabMrDiscussion[] | null,
  userId: string,
  isOwnMergeRequest: boolean,
): readonly GitLabMrDiscussion[] | null {
  if (discussions === null) return null;
  if (isOwnMergeRequest) return discussions;
  return discussions.filter((discussion) =>
    discussion.replies.some((reply) => reply.authorId === userId),
  );
}

function getDiscussionKey(
  ref: DiscussionRef | null,
  index: number,
  keys: WeakMap<DiscussionRef, number>,
  nextKey: { current: number },
): number {
  if (!ref) return index;
  const existingKey = keys.get(ref);
  if (existingKey !== undefined) return existingKey;
  const key = nextKey.current;
  nextKey.current += 1;
  keys.set(ref, key);
  return key;
}
