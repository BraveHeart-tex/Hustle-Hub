import { CheckIcon, MessageSquareTextIcon } from 'lucide-react';
import { lazy, MouseEventHandler, Suspense, useState } from 'react';

import { Button } from '@/components/ui/button';
import EditorSkeleton from '@/components/ui/editor-skeleton';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { addComment, removeComment, useComments } from '@/lib/storage/comments';
import { formatDate } from '@/lib/utils/formatters/formatDate';
import { CommentItemType } from '@/types/comments';

const RichTextEditor = lazy(() => import('@/components/ui/rich-text-editor'));

interface WorkItemCommentsProps {
  preventDefaultOnClick?: boolean;
  itemMeta: {
    itemId: string;
    itemType: CommentItemType;
    title: string;
    url: string;
  };
}

const WorkItemComments = ({
  itemMeta,
  preventDefaultOnClick = false,
}: WorkItemCommentsProps) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const { getCommentsByItemIdAndType } = useComments();
  const comments = getCommentsByItemIdAndType(
    itemMeta.itemId,
    itemMeta.itemType,
  );
  const [draft, setDraft] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!draft.trim()) return;

    try {
      setIsSubmitting(true);
      await addComment({
        item: {
          id: itemMeta.itemId,
          type: itemMeta.itemType,
          title: itemMeta.title,
          url: itemMeta.url,
        },
        content: draft,
      });
      setDraft('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolveComment = async (commentId: string) => {
    try {
      setIsSubmitting(true);
      await removeComment(commentId);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePopoverClick: MouseEventHandler = (event) => {
    if (preventDefaultOnClick) {
      event.preventDefault();
    }

    event.stopPropagation();
    setIsPopoverOpen((prev) => !prev);
  };

  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="size-4 relative"
          onClick={handlePopoverClick}
        >
          <MessageSquareTextIcon className="h-3 w-3 text-muted-foreground" />
          {comments.length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full px-1 py-0.5 text-[8px] leading-none">
              {comments.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="end"
        className="w-80 space-y-3"
        onClick={(event) => {
          if (preventDefaultOnClick) {
            event.preventDefault();
          }
          event.stopPropagation();
        }}
      >
        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {comments.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No comments yet. Use the editor below to add one.
            </p>
          ) : (
            comments.map((comment) => (
              <div
                key={comment.id}
                className="rounded-md border px-2.5 py-2 space-y-1"
              >
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>You</span>
                  <div className="flex items-center gap-2">
                    {comment.createdAt && (
                      <span>{formatDate(comment.createdAt)}</span>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-6"
                      onClick={() => handleResolveComment(comment.id)}
                    >
                      <CheckIcon className="size-4" />
                    </Button>
                  </div>
                </div>
                <div
                  className="prose prose-xs dark:prose-invert max-w-none text-foreground text-sm"
                  // Content is produced by our own editor, so it's safe to render as HTML here.
                  dangerouslySetInnerHTML={{ __html: comment.content }}
                />
              </div>
            ))
          )}
        </div>

        <div className="space-y-2">
          <Suspense fallback={<EditorSkeleton className="h-24" />}>
            <RichTextEditor
              content={draft}
              onChange={setDraft}
              placeholder="Add a comment..."
              className="border-muted h-24"
              showToolbar={false}
            />
          </Suspense>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="h-7 px-2 text-xs"
              onClick={() => setDraft('')}
              disabled={!draft.trim() || isSubmitting}
            >
              Clear
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-7 px-3 text-xs"
              onClick={handleSubmit}
              disabled={!draft.trim() || isSubmitting}
            >
              Add comment
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default WorkItemComments;
