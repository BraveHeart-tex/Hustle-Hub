import { ApiResponse } from '@/types/api';

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
  needsCurrentUserAction: boolean;
  conflicts: boolean;
  headPipelineStatus?: PipelineStatus;
}

export type PipelineStatus =
  /** Pipeline was canceled before completion. */
  | 'CANCELED'
  /** Pipeline is in the process of canceling. */
  | 'CANCELING'
  /** Pipeline has been created. */
  | 'CREATED'
  /** At least one stage of the pipeline failed. */
  | 'FAILED'
  /** Pipeline needs to be manually started. */
  | 'MANUAL'
  /** Pipeline has not started running yet. */
  | 'PENDING'
  /** Pipeline is preparing to run. */
  | 'PREPARING'
  /** Pipeline is running. */
  | 'RUNNING'
  /** Pipeline is scheduled to run. */
  | 'SCHEDULED'
  /** Pipeline was skipped. */
  | 'SKIPPED'
  /** Pipeline completed successfully. */
  | 'SUCCESS'
  /** Pipeline is waiting for an external action. */
  | 'WAITING_FOR_CALLBACK'
  /** A resource (for example, a runner) that the pipeline requires to run is unavailable. */
  | 'WAITING_FOR_RESOURCE';

export type MergeStatus =
  | 'can_be_merged'
  | 'cannot_be_merged'
  | 'unchecked'
  | 'merged'
  | 'needs_review'
  | 'approved'
  | string;

export type GitlabApiResponse = ApiResponse<{ data: GitlabMergeRequest[] }>;
