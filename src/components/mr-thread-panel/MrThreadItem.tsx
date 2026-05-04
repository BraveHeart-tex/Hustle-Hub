import {
  BotIcon,
  CheckCircle2Icon,
  CheckIcon,
  MessageSquareIcon,
  XCircleIcon,
} from 'lucide-react';

import { type Thread } from '@/components/mr-thread-panel/mr-thread-panel.types';
import { cn } from '@/lib/utils';

interface MrThreadItemProps {
  active: boolean;
  copied: boolean;
  expanded: boolean;
  index: number;
  thread: Thread;
  onCopyPrompt: (thread: Thread) => void;
  onScrollToDiscussion: (id: string, index: number) => void;
  onSetItemRef: (id: string, el: HTMLLIElement | null) => void;
  onToggleReplies: (id: string) => void;
}

export const MrThreadItem = ({
  active,
  copied,
  expanded,
  index,
  thread,
  onCopyPrompt,
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
          onClick={scrollToDiscussion}
          onKeyDown={(e) => e.key === 'Enter' && scrollToDiscussion()}
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

          <button
            type="button"
            title={copied ? 'Copied Codex prompt' : 'Copy Codex prompt'}
            onClick={(e) => {
              e.stopPropagation();
              onCopyPrompt(thread);
            }}
            className="flex items-center justify-center h-6 w-6 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            {copied ? (
              <CheckIcon className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <BotIcon className="h-3.5 w-3.5" />
            )}
          </button>

          {replyCount > 0 && (
            <div
              role="button"
              tabIndex={0}
              onClick={toggleReplies}
              onKeyDown={(e) => e.key === 'Enter' && toggleReplies()}
              className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors px-1.5 py-0.5 rounded hover:bg-muted cursor-pointer"
            >
              <MessageSquareIcon className="h-3 w-3" />
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
              onClick={scrollToDiscussion}
              onKeyDown={(e) => e.key === 'Enter' && scrollToDiscussion()}
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
};
