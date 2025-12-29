import { CheckIcon, MessageSquareTextIcon } from 'lucide-react';

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
import { Comment } from '@/types/comments';

const AllCommentsWidget = () => {
  const { comments } = useComments();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleResolveComment = async (commentId: string) => {
    try {
      setIsSubmitting(true);
      await removeComment(commentId);
    } finally {
      setIsSubmitting(false);
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

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button size="icon" variant="outline">
          <MessageSquareTextIcon className="size-4" />
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>All Comments</SheetTitle>
        </SheetHeader>
        <div>
          {commentsGroupedByItem.size === 0 ? (
            <div className="text-muted-foreground text-sm text-center py-4">
              No comments found.
            </div>
          ) : (
            Array.from(commentsGroupedByItem.values()).map((comments) => {
              const { item } = comments[0];

              return (
                <div key={`${item.type}-${item.id}`} className="pb-3 mb-3">
                  <div className="text-xs font-semibold mb-2 px-1 flex items-center gap-2">
                    {item.type === 'jira' ? <JiraIcon /> : <GitlabIcon />}
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {item.title}
                    </a>
                  </div>

                  {comments.map((comment) => (
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
                            disabled={isSubmitting}
                            onClick={() => handleResolveComment(comment.id)}
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
