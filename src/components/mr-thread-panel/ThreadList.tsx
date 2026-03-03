import { CheckCircle2Icon, MessageSquareIcon, XCircleIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { GITLAB_HIGHLIGHTED_THREAD_CLASS } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface Thread {
  id: string;
  resolved: boolean;
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

  const threadsRef = useRef<Thread[]>([]);

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
          id: discussion.dataset.discussionId || '',
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

    const targetNode = document.querySelector('#notes-list') || document.body;

    observer.observe(targetNode, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
      clearTimeout(debounceTimer);
    };
  }, [userId, collectThreads]);

  const scrollToDiscussion = (id: string) => {
    const el = document.querySelector(
      `[data-discussion-id="${id}"]`,
    ) as HTMLElement | null;

    if (!el) return;

    el.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });

    el.classList.add(GITLAB_HIGHLIGHTED_THREAD_CLASS);

    setTimeout(() => {
      el.classList.remove(GITLAB_HIGHLIGHTED_THREAD_CLASS);
    }, 1500);
  };

  if (threads.length === 0 || !isMergeRequestRoot) {
    return null;
  }

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
        className="w-72 p-0 overflow-hidden"
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
        <ul className="py-1 max-h-80 overflow-y-auto">
          {threads.map((thread, index) => (
            <li key={thread.id}>
              <button
                onClick={() => {
                  setActiveIndex(index);
                  scrollToDiscussion(thread.id);
                }}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors',
                  index === activeIndex ? 'bg-muted' : 'hover:bg-muted/60',
                )}
              >
                {thread.resolved ? (
                  <CheckCircle2Icon className="h-4 w-4 shrink-0 text-green-500" />
                ) : (
                  <XCircleIcon className="h-4 w-4 shrink-0 text-destructive" />
                )}
                <span
                  className={cn(
                    'text-xs flex-1',
                    thread.resolved
                      ? 'text-muted-foreground line-through'
                      : 'text-foreground font-medium',
                  )}
                >
                  Thread {index + 1}
                </span>
                {index === activeIndex && (
                  <span className="text-[10px] text-muted-foreground">
                    viewing
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
};
