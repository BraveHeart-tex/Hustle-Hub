// ------------------------------------------------------------
// Primitives
// ------------------------------------------------------------

export type AttentionPriority = 'critical' | 'warning' | 'info';
type AttentionStatus = 'active' | 'snoozed' | 'dismissed' | 'resolved';
export type AttentionSource = 'gitlab' | 'jira';

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
  entityTitle: string;

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
