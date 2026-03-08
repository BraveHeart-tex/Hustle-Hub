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
import { formatDate } from '@/lib/utils/formatters/formatDate';
import type { Comment } from '@/types/comments';

const AllCommentsWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { comments } = useComments();
  // Per-comment submitting state — keyed by comment id
  const [submitting, setSubmitting] = useState<Set<string>>(new Set());
  // Close sheet when last comment is resolved
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

  const commentsGroupedByItem = useMemo(() => {
    const map = new Map<string, Comment[]>();
    for (const comment of comments) {
      const key = `${comment.item.id}::${comment.item.type}`;
      const existing = map.get(key) ?? [];
      existing.push(comment);
      map.set(key, existing);
    }
    return map;
  }, [comments]);

  const groups = Array.from(commentsGroupedByItem.values());

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button size="icon" variant="outline" className="relative">
          {comments.length > 0 ? (
            <>
              <MessageSquareTextIcon className="size-4" />
              {/* Comment count badge */}
              <span className="absolute -top-1.5 -right-1.5 h-4 min-w-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-medium flex items-center justify-center leading-none">
                {comments.length > 99 ? '99+' : comments.length}
              </span>
            </>
          ) : (
            <MessageSquareIcon className="size-4" />
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>
            All Comments
            {comments.length > 0 && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({comments.length})
              </span>
            )}
          </SheetTitle>
        </SheetHeader>
        <div className="overflow-y-auto">
          {groups.length === 0 ? (
            <div className="text-muted-foreground text-sm text-center py-8">
              No comments found.
            </div>
          ) : (
            groups.map((groupComments, groupIndex) => {
              const { item } = groupComments[0];
              const isLastGroup = groupIndex === groups.length - 1;
              return (
                <div
                  key={`${item.type}-${item.id}`}
                  className={!isLastGroup ? 'border-b pb-3 mb-3' : 'pb-3'}
                >
                  {/* Group header */}
                  <div className="text-xs font-semibold mb-2 px-1 flex items-center gap-2">
                    {item.type === 'jira' ? <JiraIcon /> : <GitlabIcon />}
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline truncate"
                    >
                      {item.title}
                    </a>
                  </div>
                  {/* Comments */}
                  {groupComments.map((comment) => (
                    <div
                      key={comment.id}
                      className="px-2.5 py-2 space-y-1 first:border-t border-b"
                    >
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                        <span>You</span>
                        <div className="flex items-center gap-2">
                          {comment.createdAt && (
                            <span>{formatDate(comment.createdAt)}</span>
                          )}
                          <Button
                            size="icon"
                            variant="outline"
                            className="size-6"
                            disabled={submitting.has(comment.id)}
                            onClick={() =>
                              void handleResolveComment(comment.id)
                            }
                          >
                            <CheckIcon className="size-4" />
                          </Button>
                        </div>
                      </div>
                      <div
                        className="prose prose-xs dark:prose-invert max-w-none text-foreground text-sm"
                        dangerouslySetInnerHTML={{ __html: comment.content }}
                      />
                    </div>
                  ))}
                </div>
              );
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AllCommentsWidget;
