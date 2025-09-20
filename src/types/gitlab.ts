export interface GitlabMergeRequest {
  iid: string;
  title: string;
  createdAt: string;
  targetBranch: string;
  sourceBranch: string;
  draft: boolean;
  mergeStatus: MergeStatus;
  webUrl: string;
  userNotesCount: number;
  author: { username: string; avatarUrl: string };
  approvedByCurrentUser?: boolean;
  approvedBy: number;
  approvalsRequired: number;
  labels: { color: string; title: string }[];
  reviewers: { id: number; avatarUrl: string; hasApproved: boolean }[];
}

export type MergeStatus =
  | 'can_be_merged'
  | 'cannot_be_merged'
  | 'unchecked'
  | 'merged'
  | 'needs_review'
  | 'approved'
  | string;
