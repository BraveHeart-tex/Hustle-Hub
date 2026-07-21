import { z } from 'zod';

import { getApiUrl } from '@/services/api/client';
import type { AttentionItem } from '@/types/attention';

const RECONNECT_DELAY = 3_000;

const jiraStatusIds = [
  '3',
  '10003',
  '10004',
  '10016',
  '10050',
  '10052',
  '10053',
  '10068',
  '10071',
  '10072',
  '10400',
  '10402',
  '10403',
  '10404',
  '10405',
  '10406',
  '10407',
] as const;

const attentionActionSchema = z.object({
  type: z.literal('jira_transition'),
  targetIssueKey: z.string(),
  targetStatus: z.string(),
  targetStatusId: z.enum(jiraStatusIds),
  label: z.string(),
  confirm: z.boolean().optional(),
  allowedSourceStatusIds: z.array(z.enum(jiraStatusIds)),
});

const attentionItemSchema = z.object({
  id: z.string(),
  ruleId: z.string(),
  priority: z.enum(['critical', 'warning', 'info']),
  status: z.enum(['active', 'snoozed', 'dismissed', 'resolved']),
  source: z.enum(['gitlab', 'jira']),
  title: z.string(),
  body: z.string().optional(),
  action: attentionActionSchema.optional(),
  entityId: z.string(),
  entityUrl: z.string(),
  dedupeKey: z.string().optional(),
  resolutionMode: z.enum(['auto', 'manual']),
  entityTitle: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  snoozedUntil: z.string().optional(),
  resolvedAt: z.string().optional(),
  dismissedAt: z.string().optional(),
}) satisfies z.ZodType<AttentionItem>;

const snapshotSchema = z.array(attentionItemSchema);

export interface AttentionStreamHandlers {
  onSnapshot?: (items: AttentionItem[]) => void;
  onUpserted?: (item: AttentionItem) => void;
  onResolved?: (item: AttentionItem) => void;
  onHeartbeat?: () => void;
}

interface EventSourceLike {
  addEventListener(type: string, listener: EventListener): void;
  close(): void;
}

interface AttentionStreamOptions {
  createEventSource?: (url: string) => EventSourceLike;
  reconnectDelay?: number;
}

export function connectAttentionStream(
  handlers: AttentionStreamHandlers,
  options: AttentionStreamOptions = {},
): () => void {
  const createEventSource =
    options.createEventSource ?? ((url: string) => new EventSource(url));
  const reconnectDelay = options.reconnectDelay ?? RECONNECT_DELAY;
  let source: EventSourceLike | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let stopped = false;

  const connect = () => {
    if (stopped) return;

    source = createEventSource(getApiUrl('/api/attention/stream/'));
    source.addEventListener('snapshot', (event) => {
      parseEvent(event, snapshotSchema, 'snapshot', handlers.onSnapshot);
    });
    source.addEventListener('upserted', (event) => {
      parseEvent(event, attentionItemSchema, 'upserted', handlers.onUpserted);
    });
    source.addEventListener('resolved', (event) => {
      parseEvent(event, attentionItemSchema, 'resolved', handlers.onResolved);
    });
    source.addEventListener('heartbeat', () => handlers.onHeartbeat?.());
    source.addEventListener('error', () => {
      source?.close();
      source = null;

      if (!stopped) reconnectTimer = setTimeout(connect, reconnectDelay);
    });
  };

  connect();

  return () => {
    stopped = true;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    source?.close();
    source = null;
  };
}

function parseEvent<T>(
  event: Event,
  schema: z.ZodType<T>,
  eventName: string,
  handler?: (data: T) => void,
): void {
  if (!handler) return;

  try {
    const message = event as MessageEvent<string>;
    const result = schema.safeParse(JSON.parse(message.data));

    if (!result.success) {
      console.warn(
        `Ignoring invalid attention ${eventName} event.`,
        result.error,
      );
      return;
    }

    handler(result.data);
  } catch (error) {
    console.warn(`Ignoring malformed attention ${eventName} event.`, error);
  }
}
