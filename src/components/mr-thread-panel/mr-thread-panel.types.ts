export interface ThreadReply {
  authorName: string;
  authorAvatar: string;
  authorUrl: string;
  timestamp: string;
  timeAgo: string;
  text: string;
  isCurrentUser: boolean;
}

export interface Thread {
  id: string;
  resolved: boolean;
  replies: ThreadReply[];
}
