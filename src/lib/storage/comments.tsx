import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import { Comment, CommentItemType } from '@/types/comments';

const commentList = storage.defineItem<Comment[]>('local:comments', {
  fallback: [],
});

export const addComment = async (
  itemId: string,
  comment: string,
  itemType: CommentItemType,
) => {
  const currentComments = await commentList.getValue();
  await commentList.setValue([
    ...currentComments,
    {
      id: crypto.randomUUID(),
      itemId,
      itemType,
      content: comment,
      createdAt: new Date().toISOString(),
    },
  ]);
};

export const removeComment = async (commentId: string) => {
  const currentComments = await commentList.getValue();
  await commentList.setValue(
    currentComments.filter((comment) => comment.id !== commentId),
  );
};

type CommentUpdate = Pick<Comment, 'content'>;

export const updateComment = async (
  commentId: string,
  changes: CommentUpdate,
) => {
  const currentComments = await commentList.getValue();
  await commentList.setValue(
    currentComments.map((comment) =>
      comment.id === commentId ? { ...comment, ...changes } : comment,
    ),
  );
};

interface CommentsContextType {
  getCommentsByItemIdAndType: (
    itemId: string,
    itemType: CommentItemType,
  ) => Comment[];
}

export const CommentsContext = createContext<CommentsContextType | null>(null);

export const CommentsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [comments, setComments] = useState<Comment[]>([]);

  useEffect(() => {
    const fetchComments = async () => {
      const comments = await commentList.getValue();
      setComments(comments.reverse());
    };

    fetchComments();

    const unwatch = commentList.watch((comments) => {
      setComments(comments);
    });

    return () => {
      unwatch();
    };
  }, []);

  const getCommentsByItemIdAndType = useCallback(
    (itemId: string, itemType: CommentItemType) => {
      return comments.filter(
        (comment) => comment.itemType === itemType && comment.itemId === itemId,
      );
    },
    [comments],
  );

  return (
    <CommentsContext.Provider value={{ getCommentsByItemIdAndType }}>
      {children}
    </CommentsContext.Provider>
  );
};

export const useComments = () => {
  const context = useContext(CommentsContext);
  if (!context) {
    throw new Error('useComments must be used within a CommentsProvider');
  }
  return context;
};
