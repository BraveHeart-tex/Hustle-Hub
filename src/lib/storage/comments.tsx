import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import {
  Comment,
  CommentItemType,
  CreateCommentPayload,
  UpdateCommentPayload,
} from '@/types/comments';

const commentList = storage.defineItem<Comment[]>('local:comments', {
  fallback: [],
});

export const addComment = async (payload: CreateCommentPayload) => {
  const currentComments = await commentList.getValue();
  await commentList.setValue([
    ...currentComments,
    {
      ...payload,
      id: crypto.randomUUID(),
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

export const updateComment = async (
  commentId: string,
  changes: UpdateCommentPayload,
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
  comments: Comment[];
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
        (comment) =>
          comment.item.type === itemType && comment.item.id === itemId,
      );
    },
    [comments],
  );

  return (
    <CommentsContext.Provider value={{ comments, getCommentsByItemIdAndType }}>
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
