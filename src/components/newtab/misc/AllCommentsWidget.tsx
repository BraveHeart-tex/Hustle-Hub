import {
  CheckIcon,
  MessageSquareIcon,
  MessageSquareTextIcon,
} from 'lucide-react';
import { useMemo, useRef, useState } from 'react';

import GitlabIcon from '@/components/misc/GitlabIcon';
import JiraIcon from '@/components/misc/JiraIcon';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { removeComment, useComments } from '@/lib/storage/comments';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils/formatters/formatDate';
import type { Comment } from '@/types/comments';

const AllCommentsWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { comments } = useComments();
  const [submitting, setSubmitting] = useState<Set<string>>(new Set());

  const prevCountRef = useRef(comments.length);
  if (comments.length === 0 && prevCountRef.current > 0 && isOpen) {
    setIsOpen(false);
  }
  prevCountRef.current = comments.length;

  const handleResolveComment = async (commentId: string) => {
    setSubmitting((prev) => new Set(prev).add(commentId));
    try {
      await removeComment(commentId);
    } finally {
      setSubmitting((prev) => {
        const next = new Set(prev);
        next.delete(commentId);
        return next;
      });
    }
  };

  const groups = useMemo(() => {
    const map = new Map<string, Comment[]>();
    for (const comment of comments) {
      const key = `${comment.item.id}::${comment.item.type}`;
      const existing = map.get(key) ?? [];
      existing.push(comment);
      map.set(key, existing);
    }
    return Array.from(map.values());
  }, [comments]);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button size="icon" variant="outline" className="relative">
          {comments.length > 0 ? (
            <>
              <MessageSquareTextIcon className="size-4" />
              <span className="absolute -top-1.5 -right-1.5 h-4 min-w-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-medium flex items-center justify-center leading-none">
                {comments.length > 99 ? '99+' : comments.length}
              </span>
            </>
          ) : (
            <MessageSquareIcon className="size-4" />
          )}
        </Button>
      </SheetTrigger>

      <SheetContent className="sm:max-w-lg p-0 flex flex-col gap-0">
        {/* Header */}
        <SheetHeader className="px-5 py-4 border-b shrink-0">
          <SheetTitle className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <MessageSquareTextIcon className="h-4 w-4 text-primary" />
            </div>
            <span>Notes</span>
            {comments.length > 0 && (
              <span className="ml-0.5 text-xs font-normal text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                {comments.length}
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {groups.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                <MessageSquareIcon className="h-6 w-6 text-muted-foreground/40" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  No notes yet
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Notes you add to MRs and tickets will appear here.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {groups.map((groupComments) => {
                const { item } = groupComments[0];
                return (
                  <div key={`${item.type}-${item.id}`}>
                    {/* Group header */}
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-5 w-5 shrink-0 flex items-center justify-center">
                        {item.type === 'jira' ? <JiraIcon /> : <GitlabIcon />}
                      </div>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold hover:underline underline-offset-2 truncate text-foreground"
                      >
                        {item.title}
                      </a>
                      <span className="ml-auto text-[10px] text-muted-foreground shrink-0">
                        {groupComments.length}{' '}
                        {groupComments.length === 1 ? 'note' : 'notes'}
                      </span>
                    </div>

                    {/* Comment cards */}
                    <div className="rounded-lg border border-border/60 overflow-hidden divide-y divide-border/60">
                      {groupComments.map((comment) => (
                        <div
                          key={comment.id}
                          className="group px-3.5 py-2.5 bg-card hover:bg-muted/20 transition-colors"
                        >
                          {/* Meta */}
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] text-muted-foreground/60">
                              {comment.createdAt
                                ? formatDate(comment.createdAt)
                                : 'You'}
                            </span>
                            <button
                              onClick={() =>
                                void handleResolveComment(comment.id)
                              }
                              disabled={submitting.has(comment.id)}
                              className={cn(
                                'opacity-0 group-hover:opacity-100 transition-opacity',
                                'flex items-center gap-1 text-[10px] text-muted-foreground',
                                'hover:text-green-500 transition-colors',
                                submitting.has(comment.id) &&
                                  'opacity-50 cursor-not-allowed',
                              )}
                            >
                              <CheckIcon className="h-3 w-3" />
                              Resolve
                            </button>
                          </div>
                          {/* Content */}
                          <div
                            className="prose prose-xs dark:prose-invert max-w-none text-foreground text-sm [&_p]:my-0 leading-relaxed"
                            dangerouslySetInnerHTML={{
                              __html: comment.content,
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AllCommentsWidget;
