export interface Comment {
  id: string;
  content: string;
  item: {
    id: string;
    type: CommentItemType;
    title: string;
    url: string;
  };
  createdAt: string;
}

export type CommentItemType = 'jira' | 'gitlab';

export type CreateCommentPayload = Omit<Comment, 'id' | 'createdAt'>;

export type UpdateCommentPayload = Pick<Comment, 'content'>;
