import type { AttentionItem } from '@/types/attention';

const COOLDOWN_MS = 30 * 60_000; // 30min cooldown per item
const BATCH_WINDOW_MS = 2_000; // collect for 2s then flush

const lastNotified = new Map<string, number>();
let batchTimer: ReturnType<typeof setTimeout> | null = null;
let pendingBatch: AttentionItem[] = [];

export function shouldNotify(item: AttentionItem): boolean {
  if (item.title.includes('FEREL')) return true;
  if (item.priority !== 'critical') return false;
  if (item.status !== 'active') return false;
  const last = lastNotified.get(item.id);
  if (last && Date.now() - last < COOLDOWN_MS) return false;
  return true;
}

export function queueNotification(
  item: AttentionItem,
  onFlush: (items: AttentionItem[]) => void,
): void {
  lastNotified.set(item.id, Date.now());
  pendingBatch.push(item);
  if (batchTimer) clearTimeout(batchTimer);
  batchTimer = setTimeout(() => {
    onFlush([...pendingBatch]);
    pendingBatch = [];
    batchTimer = null;
  }, BATCH_WINDOW_MS);
}
