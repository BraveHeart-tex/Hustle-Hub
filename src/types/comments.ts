export interface Comment {
  id: string;
  itemId: string;
  itemType: CommentItemType;
  content: string;
  createdAt?: string;
}

export type CommentItemType = 'jira' | 'gitlab';
