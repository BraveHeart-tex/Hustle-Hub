import { afterEach, describe, expect, it, vi } from 'vitest';

import { connectAttentionStream } from '@/services/attentionStream';
import type { AttentionItem } from '@/types/attention';

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('attention stream', () => {
  it('delivers typed snapshot, upserted, resolved, and heartbeat events', () => {
    const sources: FakeEventSource[] = [];
    const handlers = {
      onHeartbeat: vi.fn(),
      onResolved: vi.fn(),
      onSnapshot: vi.fn(),
      onUpserted: vi.fn(),
    };
    const stop = connectAttentionStream(handlers, {
      createEventSource: (url) => {
        const source = new FakeEventSource(url);
        sources.push(source);
        return source;
      },
    });
    const item = makeAttentionItem();

    sources[0].emitMessage('snapshot', JSON.stringify([item]));
    sources[0].emitMessage('upserted', JSON.stringify(item));
    sources[0].emitMessage('resolved', JSON.stringify(item));
    sources[0].emit('heartbeat');

    expect(handlers.onSnapshot).toHaveBeenCalledWith([item]);
    expect(handlers.onUpserted).toHaveBeenCalledWith(item);
    expect(handlers.onResolved).toHaveBeenCalledWith(item);
    expect(handlers.onHeartbeat).toHaveBeenCalledOnce();
    stop();
  });

  it('logs and skips malformed or invalid payloads', () => {
    const source = new FakeEventSource('');
    const onUpserted = vi.fn();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const stop = connectAttentionStream(
      { onUpserted },
      { createEventSource: () => source },
    );

    source.emitMessage('upserted', '{bad json');
    source.emitMessage('upserted', JSON.stringify({ id: 'incomplete' }));

    expect(onUpserted).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledTimes(2);
    stop();
  });

  it('reconnects after transport errors and cleanup cancels future work', () => {
    vi.useFakeTimers();
    const sources: FakeEventSource[] = [];
    const stop = connectAttentionStream(
      {},
      {
        createEventSource: (url) => {
          const source = new FakeEventSource(url);
          sources.push(source);
          return source;
        },
        reconnectDelay: 10,
      },
    );

    sources[0].emit('error');
    expect(sources[0].closed).toBe(true);
    vi.advanceTimersByTime(10);
    expect(sources).toHaveLength(2);

    sources[1].emit('error');
    stop();
    vi.advanceTimersByTime(10);
    expect(sources).toHaveLength(2);
  });
});

class FakeEventSource {
  readonly listeners = new Map<string, EventListener[]>();
  closed = false;

  constructor(readonly url: string) {}

  addEventListener(type: string, listener: EventListener): void {
    const listeners = this.listeners.get(type) ?? [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }

  close(): void {
    this.closed = true;
  }

  emit(type: string): void {
    for (const listener of this.listeners.get(type) ?? []) {
      listener(new Event(type));
    }
  }

  emitMessage(type: string, data: string): void {
    for (const listener of this.listeners.get(type) ?? []) {
      listener(new MessageEvent(type, { data }));
    }
  }
}

function makeAttentionItem(): AttentionItem {
  return {
    action: {
      allowedSourceStatusIds: ['10003', '10004'],
      label: 'Move to On Preprod',
      targetIssueKey: 'FE-1662',
      targetStatus: 'On Preprod',
      targetStatusId: '10016',
      type: 'jira_transition',
    },
    createdAt: '2026-01-01T00:00:00.000Z',
    entityId: '1',
    entityTitle: 'Entity',
    entityUrl: 'https://example.com/entity/1',
    id: 'item-1',
    priority: 'warning',
    resolutionMode: 'auto',
    ruleId: 'rule',
    source: 'gitlab',
    status: 'active',
    title: 'Attention',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}
