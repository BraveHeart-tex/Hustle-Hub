export interface GitLabUser {
  id: number;
  username: string;
  public_email: string;
  name: string;
  state: string;
  locked: boolean;
  avatar_url: string;
  web_url: string;
}

export interface GitLabReferences {
  short: string;
  relative: string;
  full: string;
}

export interface GitLabTimeStats {
  time_estimate: number;
  total_time_spent: number;
  human_time_estimate: string | null;
  human_total_time_spent: string | null;
}

export interface GitLabTaskCompletionStatus {
  count: number;
  completed_count: number;
}

export interface GitLabMergeRequest {
  id: number;
  iid: number;
  project_id: number;
  title: string;
  description: string;
  state: string;
  created_at: string;
  updated_at: string;
  merged_by: GitLabUser | null;
  merge_user: GitLabUser | null;
  merged_at: string | null;
  closed_by: GitLabUser | null;
  closed_at: string | null;
  target_branch: string;
  source_branch: string;
  user_notes_count: number;
  upvotes: number;
  downvotes: number;
  author: GitLabUser;
  assignees: GitLabUser[];
  assignee: GitLabUser;
  reviewers: GitLabUser[];
  source_project_id: number;
  target_project_id: number;
  labels: string[];
  draft: boolean;
  imported: boolean;
  imported_from: string;
  work_in_progress: boolean;
  milestone: string | null;
  merge_when_pipeline_succeeds: boolean;
  merge_status: string;
  detailed_merge_status: string;
  merge_after: string | null;
  sha: string;
  merge_commit_sha: string | null;
  squash_commit_sha: string | null;
  discussion_locked: boolean | null;
  should_remove_source_branch: boolean | null;
  force_remove_source_branch: boolean;
  prepared_at: string;
  reference: string;
  references: GitLabReferences;
  web_url: string;
  time_stats: GitLabTimeStats;
  squash: boolean;
  squash_on_merge: boolean;
  task_completion_status: GitLabTaskCompletionStatus;
  has_conflicts: boolean;
  blocking_discussions_resolved: boolean;
  approvals_before_merge: number | null;
}

export interface GitLabMRResponse {
  assigned: GitLabMergeRequest[];
  review: GitLabMergeRequest[];
}

export type MergeStatus =
  | 'can_be_merged'
  | 'cannot_be_merged'
  | 'unchecked'
  | 'merged'
  | 'needs_review'
  | 'approved'
  | string; // fallback for unexpected values
