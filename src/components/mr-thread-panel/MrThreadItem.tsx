import { CheckCircle2Icon, MessageSquareIcon, XCircleIcon } from 'lucide-react';
import { type KeyboardEvent } from 'react';

import { type Thread } from '@/components/mr-thread-panel/mr-thread-panel.types';
import { cn } from '@/lib/utils';

interface MrThreadItemProps {
  active: boolean;
  expanded: boolean;
  index: number;
  thread: Thread;
  onScrollToDiscussion: (id: string, index: number) => void;
  onSetItemRef: (id: string, el: HTMLLIElement | null) => void;
  onToggleReplies: (id: string) => void;
}

export const MrThreadItem = ({
  active,
  expanded,
  index,
  thread,
  onScrollToDiscussion,
  onSetItemRef,
  onToggleReplies,
}: MrThreadItemProps) => {
  const replyCount = thread.replies.length;
  const lastReply = thread.replies[thread.replies.length - 1];
  const hasUnreadReply = Boolean(
    !thread.resolved && lastReply && !lastReply.isCurrentUser,
  );

  const scrollToDiscussion = () => onScrollToDiscussion(thread.id, index);
  const toggleReplies = () => onToggleReplies(thread.id);

  // Custom `role="button"` elements must handle both Enter and Space, and
  // Space must not scroll the popover.
  const activateOnKey = (action: () => void) => (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      action();
    }
  };

  return (
    <li
      ref={(el) => {
        onSetItemRef(thread.id, el);
      }}
    >
      {/* Thread row — div to avoid button-in-button.
          Left area scrolls to discussion, right area toggles replies. */}
      <div
        className={cn(
          'flex items-center gap-2.5 px-3 py-2 transition-colors',
          active ? 'bg-muted' : 'hover:bg-muted/60',
        )}
      >
        {/* Clickable left area — scroll to discussion */}
        <div
          role="button"
          tabIndex={0}
          aria-label={`Go to thread ${index + 1}`}
          onClick={scrollToDiscussion}
          onKeyDown={activateOnKey(scrollToDiscussion)}
          className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50"
        >
          {thread.resolved ? (
            <CheckCircle2Icon className="h-4 w-4 shrink-0 text-success" />
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
            <span className="h-1.5 w-1.5 rounded-full bg-info" />
          )}

          {replyCount > 0 && (
            <div
              role="button"
              tabIndex={0}
              aria-expanded={expanded}
              aria-label={`${expanded ? 'Hide' : 'Show'} ${replyCount} ${
                replyCount === 1 ? 'reply' : 'replies'
              }`}
              onClick={toggleReplies}
              onKeyDown={activateOnKey(toggleReplies)}
              className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors motion-reduce:transition-none px-1.5 py-0.5 rounded hover:bg-muted cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <MessageSquareIcon aria-hidden="true" className="h-3 w-3" />
              {replyCount}
            </div>
          )}
          {active && (
            <span className="text-[10px] text-muted-foreground">viewing</span>
          )}
        </div>
      </div>

      {/* Replies — 1 level deep */}
      {expanded && replyCount > 0 && (
        <ul className="border-t border-border/40 bg-muted/20">
          {thread.replies.map((reply) => (
            <li
              key={`${reply.timestamp}-${reply.authorName}-${reply.text}`}
              role="button"
              tabIndex={0}
              aria-label={`Go to thread ${index + 1}`}
              onClick={scrollToDiscussion}
              onKeyDown={activateOnKey(scrollToDiscussion)}
              className="flex items-start gap-2 px-4 py-2 border-b border-border/30 last:border-0 cursor-pointer hover:bg-muted/40 transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50"
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
                      'text-xs font-medium truncate',
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
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                  {reply.text}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
};
