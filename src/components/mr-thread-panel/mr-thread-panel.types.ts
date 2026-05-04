export interface ThreadReply {
  authorName: string;
  authorAvatar: string;
  authorUrl: string;
  timestamp: string;
  timeAgo: string;
  text: string;
  isCurrentUser: boolean;
}

export interface ThreadCodeLine {
  oldLine: number | null;
  newLine: number | null;
  code: string;
  type: 'old' | 'new' | 'context';
}

export interface ThreadPromptData {
  discussionId: string;
  filePath: string | null;
  permalink: string | null;
  commentedLine: {
    oldLine: number | null;
    newLine: number | null;
    code: string;
  } | null;
  codeContext: ThreadCodeLine[];
}

export interface Thread {
  id: string;
  resolved: boolean;
  replies: ThreadReply[];
  promptData: ThreadPromptData;
}
