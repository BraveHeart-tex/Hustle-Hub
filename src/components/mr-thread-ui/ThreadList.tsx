import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
  const [threads, setThreads] = useState<Thread[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const collectThreads = () => {
      const discussions = Array.from(
        document.querySelectorAll(
          `.discussion[data-testid="discussion-content"]`,
        ),
      ) as HTMLElement[];

      const userThreads = discussions
        .filter((discussion) =>
          discussion.querySelector(
            `a.author-name-link[data-user-id="${userId}"]`,
          ),
        )
        .map((discussion) => ({
          id: discussion.dataset.discussionId!,
          resolved: discussion.dataset.discussionResolved === 'true',
        }));

      setThreads(userThreads);
    };

    collectThreads();

    const observer = new MutationObserver(() => {
      collectThreads();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, [userId]);

  const scrollToDiscussion = (id: string) => {
    const el = document.querySelector(
      `[data-discussion-id="${id}"]`,
    ) as HTMLElement | null;

    if (!el) return;

    el.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });

    const originalTransition = el.style.transition;
    const originalBoxShadow = el.style.boxShadow;

    el.style.transition = 'box-shadow 0.3s ease, transform 0.3s ease';
    el.style.boxShadow = '0 0 0 3px #1f75cb';

    setTimeout(() => {
      el.style.boxShadow = originalBoxShadow;

      el.style.transition = originalTransition;
    }, 1500);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className="fixed bottom-6 right-6 z-999999" asChild>
        <Button size="sm" className="rounded-full shadow-md">
          {!userId
            ? 'Please provide VITE_GITLAB_USER_ID in .env'
            : `🧵 ${threads.length}`}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        container={container}
        className="w-64 max-h-96 overflow-y-auto shadow-xl rounded-xl p-3 space-y-2 flex flex-col"
      >
        <div className="font-semibold text-sm mb-2">Your Threads</div>

        {threads.length === 0 && (
          <div className="text-xs text-muted-foreground">No threads found</div>
        )}

        {threads.map((thread, index) => (
          <button
            key={thread.id}
            onClick={() => {
              setActiveIndex(index);
              scrollToDiscussion(thread.id);
            }}
            className={cn(
              'w-full text-left text-sm px-2 py-1 rounded-md transition cursor-pointer',
              index === activeIndex ? 'bg-muted/70' : 'hover:bg-muted',
              thread.resolved ? 'opacity-60' : 'font-medium',
            )}
          >
            {thread.resolved ? '🟢' : '🔴'} Thread {index + 1}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
};
