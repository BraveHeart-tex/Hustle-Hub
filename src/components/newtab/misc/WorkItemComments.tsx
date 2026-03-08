import { CheckIcon, MessageSquareIcon, PlusIcon, SendIcon } from 'lucide-react';
import {
  lazy,
  type MouseEventHandler,
  Suspense,
  useCallback,
  useRef,
  useState,
} from 'react';

import { Button } from '@/components/ui/button';
import EditorSkeleton from '@/components/ui/editor-skeleton';
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
  const tiptapRef = useRef<TiptapRef>(null);
  const [draft, setDraft] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resolvingIds, setResolvingIds] = useState<Set<string>>(new Set());
  const [showEditor, setShowEditor] = useState(false);

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
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolveComment = async (commentId: string) => {
    setResolvingIds((prev) => new Set(prev).add(commentId));
    try {
      await removeComment(commentId);
    } finally {
      setResolvingIds((prev) => {
        const next = new Set(prev);
        next.delete(commentId);
        return next;
      });
    }
  };

  const handleTriggerClick: MouseEventHandler = (event) => {
    if (preventDefaultOnClick) event.preventDefault();
    event.stopPropagation();
  };

  const handleContentClick: MouseEventHandler = (event) => {
    if (preventDefaultOnClick) event.preventDefault();
    event.stopPropagation();
  };

  const isEditorEmpty = !draft.trim();
  const hasComments = comments.length > 0;

  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="size-4 relative text-muted-foreground hover:text-foreground transition-colors"
          onClick={handleTriggerClick}
        >
          <MessageSquareIcon />
          {hasComments && (
            <span className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground rounded-full min-w-[14px] h-[14px] px-[3px] text-[8px] leading-none flex items-center justify-center font-medium">
              {comments.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        side="bottom"
        align="end"
        className="w-72 p-0 overflow-hidden shadow-lg"
        onClick={handleContentClick}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30">
          <div className="flex items-center gap-1.5">
            <MessageSquareIcon className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium">Notes</span>
            {hasComments && (
              <span className="text-[10px] text-muted-foreground bg-muted rounded-full px-1.5 py-px">
                {comments.length}
              </span>
            )}
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-5 w-5 text-muted-foreground hover:text-foreground"
            onClick={() => {
              setShowEditor((v) => !v);
              if (!showEditor) setTimeout(focusEditor, 50);
            }}
          >
            <PlusIcon className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Comment list */}
        {hasComments && (
          <div className="max-h-48 overflow-y-auto">
            {comments.map((comment, i) => (
              <div
                key={comment.id}
                className={cn(
                  'group px-3 py-2 transition-colors hover:bg-muted/30',
                  i !== comments.length - 1 && 'border-b border-border/50',
                )}
              >
                {/* Meta row */}
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-muted-foreground/70">
                    {comment.createdAt ? formatDate(comment.createdAt) : 'You'}
                  </span>
                  <button
                    onClick={() => void handleResolveComment(comment.id)}
                    disabled={resolvingIds.has(comment.id)}
                    className={cn(
                      'opacity-0 group-hover:opacity-100 transition-opacity',
                      'h-4 w-4 rounded flex items-center justify-center',
                      'text-muted-foreground hover:text-green-500 hover:bg-green-500/10',
                      resolvingIds.has(comment.id) &&
                        'opacity-50 cursor-not-allowed',
                    )}
                    title="Resolve"
                  >
                    <CheckIcon className="h-3 w-3" />
                  </button>
                </div>
                {/* Content */}
                <div
                  className="prose prose-xs dark:prose-invert max-w-none text-foreground text-xs leading-relaxed [&_p]:my-0"
                  dangerouslySetInnerHTML={{ __html: comment.content }}
                />
              </div>
            ))}
          </div>
        )}

        {/* Empty state — shown when no comments and editor is hidden */}
        {!hasComments && !showEditor && (
          <div className="flex flex-col items-center gap-2 py-6 text-center px-4">
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
              <MessageSquareIcon className="h-4 w-4 text-muted-foreground/50" />
            </div>
            <p className="text-xs text-muted-foreground">
              No notes yet.{' '}
              <button
                className="text-foreground underline underline-offset-2 hover:no-underline"
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
          <div className="border-t border-border/50 p-2 space-y-2 bg-muted/10">
            <Suspense fallback={<EditorSkeleton className="h-20" />}>
              <RichTextEditor
                ref={tiptapRef}
                content={draft}
                onChange={setDraft}
                placeholder="Add a note..."
                className="border-muted h-20 text-xs"
                showToolbar={false}
                onReady={focusEditor}
                onCmdEnter={() => void handleSubmit()}
              />
            </Suspense>
            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  clearEditor();
                  setShowEditor(false);
                }}
                className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <Button
                type="button"
                size="sm"
                className="h-6 px-2.5 text-xs gap-1.5"
                onClick={() => void handleSubmit()}
                disabled={isEditorEmpty || isSubmitting}
              >
                <SendIcon className="h-3 w-3" />
                Save
              </Button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default WorkItemComments;
