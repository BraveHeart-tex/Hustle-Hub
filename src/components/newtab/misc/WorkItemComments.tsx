import DOMPurify from 'dompurify';
import { CheckIcon, MessageSquareIcon, PlusIcon, SendIcon } from 'lucide-react';
import {
  lazy,
  type MouseEventHandler,
  Suspense,
  useCallback,
  useId,
  useRef,
  useState,
} from 'react';

import { Button } from '@/components/ui/button';
import { EditorSkeleton } from '@/components/ui/editor-skeleton';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { type TiptapRef } from '@/components/ui/rich-text-editor';
import { addComment, removeComment, useComments } from '@/lib/storage/comments';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils/formatters/formatDate';
import { type CommentItemType } from '@/types/comments';

const RichTextEditor = lazy(() =>
  import('@/components/ui/rich-text-editor').then((module) => ({
    default: module.RichTextEditor,
  })),
);

const sanitizeCommentContent = (content: string) => DOMPurify.sanitize(content);

interface WorkItemCommentsProps {
  triggerClassName?: string;
  itemMeta: {
    itemId: string;
    itemType: CommentItemType;
    title: string;
    url: string;
  };
}

export const WorkItemComments = ({
  itemMeta,
  triggerClassName,
}: WorkItemCommentsProps) => {
  const popoverId = useId();
  const editorId = useId();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const { getCommentsByItemIdAndType } = useComments();
  const comments = getCommentsByItemIdAndType(
    itemMeta.itemId,
    itemMeta.itemType,
  );
  const tiptapRef = useRef<TiptapRef>(null);
  const [draft, setDraft] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resolvingIds, setResolvingIds] = useState<Set<string>>(new Set());
  const [showEditor, setShowEditor] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const focusEditor = useCallback(() => {
    tiptapRef.current?.editor?.commands.focus();
  }, []);

  const clearEditor = useCallback(() => {
    setDraft('');
    tiptapRef.current?.editor?.commands.setContent('');
  }, []);

  const handleSubmit = async () => {
    const editor = tiptapRef.current?.editor;
    if (!editor || editor.isEmpty) {
      focusEditor();
      return;
    }
    // Get content directly from editor, not from draft state
    const content = editor.getHTML();
    if (!content.trim()) {
      focusEditor();
      return;
    }
    try {
      setErrorMessage('');
      setIsSubmitting(true);
      await addComment({
        content,
        item: {
          id: itemMeta.itemId,
          title: itemMeta.title,
          type: itemMeta.itemType,
          url: itemMeta.url,
        },
      });
      clearEditor();
      setShowEditor(false);
    } catch {
      setErrorMessage('Could not save the comment. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolveComment = async (commentId: string) => {
    setResolvingIds((prev) => new Set(prev).add(commentId));
    try {
      setErrorMessage('');
      await removeComment(commentId);
    } catch {
      setErrorMessage('Could not resolve the comment. Try again.');
    } finally {
      setResolvingIds((prev) => {
        const next = new Set(prev);
        next.delete(commentId);
        return next;
      });
    }
  };

  const handleTriggerClick: MouseEventHandler = (event) => {
    event.stopPropagation();
    setIsPopoverOpen((prev) => !prev);
  };

  const handleContentClick: MouseEventHandler = (event) => {
    event.stopPropagation();
  };

  const isEditorEmpty = tiptapRef.current?.editor?.isEmpty ?? true;
  const hasComments = comments.length > 0;

  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className={cn(
            'relative size-8 text-muted-foreground motion-safe:transition-colors hover:text-foreground',
            triggerClassName,
          )}
          onClick={handleTriggerClick}
          aria-label={`Comments for ${itemMeta.title}`}
          aria-expanded={isPopoverOpen}
          aria-controls={popoverId}
          title="Comments"
        >
          <MessageSquareIcon aria-hidden="true" />
          {hasComments && (
            <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-xs font-medium leading-none text-primary-foreground">
              {comments.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        id={popoverId}
        side="bottom"
        align="end"
        className="w-80 max-w-[calc(100vw-1.5rem)] overflow-hidden p-0"
        onClick={handleContentClick}
      >
        {/* Header */}
        <div className="flex min-h-10 items-center justify-between border-b bg-muted/30 px-3 py-2">
          <div className="flex items-center gap-1.5">
            <MessageSquareIcon className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm font-medium">Comments</span>
            {hasComments && (
              <span className="rounded-full bg-muted px-1.5 py-px text-xs text-muted-foreground">
                {comments.length}
              </span>
            )}
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="size-7 text-muted-foreground hover:text-foreground"
            aria-label={showEditor ? 'Hide comment editor' : 'Add comment'}
            aria-expanded={showEditor}
            aria-controls={editorId}
            title={showEditor ? 'Hide comment editor' : 'Add comment'}
            onClick={() => {
              setShowEditor((v) => !v);
              if (!showEditor) setTimeout(focusEditor, 50);
            }}
          >
            <PlusIcon
              aria-hidden="true"
              className={cn(
                'h-3.5 w-3.5 transition-transform duration-150 ease-out motion-reduce:transition-none',
                showEditor && 'rotate-45',
              )}
            />
          </Button>
        </div>

        {/* Comment list */}
        {hasComments && (
          <div className="max-h-64 overflow-y-auto">
            {comments.map((comment, i) => (
              <div
                key={comment.id}
                className={cn(
                  'group px-3 py-2.5 motion-safe:transition-colors hover:bg-muted/30',
                  i !== comments.length - 1 && 'border-b border-border/50',
                )}
              >
                {/* Meta row */}
                <div className="mb-1 flex min-h-6 items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {comment.createdAt ? formatDate(comment.createdAt) : 'You'}
                  </span>
                  <button
                    onClick={() => void handleResolveComment(comment.id)}
                    disabled={resolvingIds.has(comment.id)}
                    className={cn(
                      'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100 motion-safe:transition-opacity',
                      'flex size-6 items-center justify-center rounded-md',
                      'text-muted-foreground hover:text-success hover:bg-success/10',
                      'outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px]',
                      resolvingIds.has(comment.id) &&
                        'opacity-50 cursor-not-allowed',
                    )}
                    aria-label="Resolve comment"
                    title="Resolve"
                  >
                    <CheckIcon aria-hidden="true" className="h-3 w-3" />
                  </button>
                </div>
                {/* Content */}
                <div
                  className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed text-foreground [&_p]:my-0"
                  dangerouslySetInnerHTML={{
                    __html: sanitizeCommentContent(comment.content),
                  }}
                />
              </div>
            ))}
          </div>
        )}

        {/* Empty state — shown when no comments and editor is hidden */}
        {!hasComments && !showEditor && (
          <div className="flex flex-col items-center gap-2 px-4 py-7 text-center">
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
              <MessageSquareIcon className="h-4 w-4 text-muted-foreground/50" />
            </div>
            <p className="text-sm text-muted-foreground">
              No comments yet.{' '}
              <button
                className="rounded-sm font-medium text-foreground underline underline-offset-2 outline-none hover:no-underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
                onClick={() => {
                  setShowEditor(true);
                  setTimeout(focusEditor, 50);
                }}
              >
                Add one
              </button>
            </p>
          </div>
        )}

        {/* Editor — toggled by + button */}
        {showEditor && (
          <div
            id={editorId}
            className="space-y-2.5 border-t border-border/50 bg-muted/10 p-2.5"
          >
            <Suspense fallback={<EditorSkeleton className="h-20" />}>
              <RichTextEditor
                ref={tiptapRef}
                content={draft}
                onChange={setDraft}
                placeholder="Write a comment…"
                ariaLabel="Comment"
                editorClassName="compact-editor min-h-20 max-h-40 overflow-y-auto"
                onReady={focusEditor}
                onCmdEnter={() => void handleSubmit()}
              />
            </Suspense>
            <div className="flex min-h-8 items-center justify-between gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  clearEditor();
                  setShowEditor(false);
                  setErrorMessage('');
                }}
                className="text-muted-foreground"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                className="h-8 gap-1.5 px-3"
                onClick={() => void handleSubmit()}
                disabled={isEditorEmpty || isSubmitting}
                loading={isSubmitting}
                aria-keyshortcuts="Meta+Enter Control+Enter"
              >
                <SendIcon className="h-3 w-3" />
                Add comment
              </Button>
            </div>
          </div>
        )}
        {errorMessage && (
          <p
            role="alert"
            className="border-t border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive"
          >
            {errorMessage}
          </p>
        )}
      </PopoverContent>
    </Popover>
  );
};
