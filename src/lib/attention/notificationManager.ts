import type { AttentionItem } from '@/types/attention';

const BATCH_WINDOW_MS = 2_000; // collect for 2s then flush

let batchTimer: ReturnType<typeof setTimeout> | null = null;
let pendingBatch: AttentionItem[] = [];

const lastNotifiedAt = new Map<string, string>(); // itemId → updatedAt

const ALWAYS_NOTIFY_RULES = new Set([
  'pending-your-review',
  'unanswered-reply',
  'release-mr-got-activity',
  'ferel-on-preprod',
  'ferel-missing-mr',
  'pipeline-failed',
  'ready-but-pipeline-pending',
]);

export function shouldNotify(item: AttentionItem): boolean {
  if (item.status !== 'active') return false;

  const lastSeen = lastNotifiedAt.get(item.id);
  if (lastSeen && lastSeen === item.updatedAt) return false;

  if (ALWAYS_NOTIFY_RULES.has(item.ruleId)) return true;

  if (item.priority !== 'critical') return false;

  return true;
}

export function queueNotification(
  item: AttentionItem,
  onFlush: (items: AttentionItem[]) => void,
): void {
  lastNotifiedAt.set(item.id, item.updatedAt);
  pendingBatch.push(item);
  if (batchTimer) clearTimeout(batchTimer);
  batchTimer = setTimeout(() => {
    onFlush([...pendingBatch]);
    pendingBatch = [];
    batchTimer = null;
  }, BATCH_WINDOW_MS);
}
