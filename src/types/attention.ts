// ------------------------------------------------------------
// Primitives
// ------------------------------------------------------------

export type AttentionPriority = 'critical' | 'warning' | 'info';
export type AttentionStatus = 'active' | 'snoozed' | 'dismissed' | 'resolved';
export type AttentionSource = 'gitlab' | 'jira';
export type MRRole = 'author' | 'reviewer';

// ------------------------------------------------------------
// Attention Item
// The single output unit the entire system produces.
// ------------------------------------------------------------

export interface AttentionItem {
  /**
   * Deterministic composite key: `${ruleId}:${entityId}`
   * e.g. "ready-to-merge:847"
   * Ensures the same rule firing on the same entity upserts, never duplicates.
   */
  id: string;

  ruleId: string;
  priority: AttentionPriority;
  status: AttentionStatus;
  source: AttentionSource;

  title: string;
  body?: string;

  entityId: string;
  entityUrl: string;

  /**
   * Controls whether this item can resolve itself automatically.
   * - 'auto'   → rule re-evaluates each cycle; if it returns null the item is resolved
   * - 'manual' → stays active until the user explicitly dismisses or snoozes it
   */
  resolutionMode: 'auto' | 'manual';

  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601, updated on every upsert
  snoozedUntil?: string; // ISO 8601, only set when status === 'snoozed'
  resolvedAt?: string; // ISO 8601, only set when status === 'resolved'
  dismissedAt?: string; // ISO 8601, only set when status === 'dismissed'
}

// ------------------------------------------------------------
// Snapshots
// Stored in Redis. Represent the last-known state of an entity.
// The delta between prev and curr snapshot is what drives rules.
// ------------------------------------------------------------

export interface MRSnapshot {
  id: string; // GitLab MR iid (e.g. "847")
  projectId: string;
  title: string;
  url: string;

  state: 'opened' | 'merged' | 'closed' | 'locked';
  role: MRRole;

  authorId: string;
  reviewerIds: string[];
  assigneeIds: string[];

  approvalCount: number;
  approvalsRequired: number;
  unresolvedThreadCount: number;

  /**
   * IDs of users who have participated in any thread on this MR.
   * Used to detect "someone replied in a thread you're part of".
   */
  threadParticipantIds: string[];

  /**
   * ID of the user who last commented / acted on the MR.
   * Used to detect if it's your turn to respond.
   */
  lastActivityByUserId: string;
  lastActivityAt: string; // ISO 8601
  lastCommitAt: string; // ISO 8601

  targetBranch: string;
  isDraft: boolean;
  hasConflicts: boolean;

  /**
   * Linked Jira ticket key extracted from branch name or MR description.
   * e.g. "PROJ-234"
   */
  linkedTicketKey?: string;
}

export interface TicketSnapshot {
  id: string; // Jira issue key, e.g. "PROJ-234"
  url: string;
  summary: string;

  status: string; // raw Jira status name, e.g. "In Progress"
  statusCategory: 'todo' | 'in_progress' | 'done';

  assigneeId: string;
  reporterId: string;

  /**
   * MR iids that are linked to this ticket (via branch name or manual link).
   * Populated by cross-referencing MR snapshots.
   */
  linkedMRIds: string[];

  priority: 'highest' | 'high' | 'medium' | 'low' | 'lowest';
  isRelease: boolean; // true if this is a release-type ticket

  updatedAt: string; // ISO 8601
  createdAt: string; // ISO 8601
}

export type EntitySnapshot = MRSnapshot | TicketSnapshot;
