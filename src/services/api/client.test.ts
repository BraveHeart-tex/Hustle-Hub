import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApiError, executeMutation, executeRead } from '@/services/api/client';
import { snoozeAttentionItem } from '@/services/attention';
import { fetchGitlabMergeRequests } from '@/services/gitlab';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('API client', () => {
  it('serializes a typed GET path and query and unwraps its data', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({
        success: true,
        data: [],
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchGitlabMergeRequests('assigned')).resolves.toEqual([]);

    const request = fetchMock.mock.calls[0][0] as Request;
    const url = new URL(request.url);
    expect(url.pathname).toBe('/api/data/gitlab/merge-requests/');
    expect(url.searchParams.get('filter')).toBe('assigned');
    expect(request.method).toBe('GET');
  });

  it('serializes a typed mutation body without retrying it', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({
        success: true,
        data: makeAttentionItem(),
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await snoozeAttentionItem('item-1', '30m');

    const request = fetchMock.mock.calls[0][0] as Request;
    expect(request.method).toBe('PATCH');
    expect(new URL(request.url).pathname).toBe('/api/attention/item-1/snooze');
    await expect(request.json()).resolves.toEqual({ duration: '30m' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('maps documented failures to ApiError', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json(
        {
          success: false,
          error: { type: 'BAD_REQUEST', message: 'Invalid filter.' },
        },
        { status: 400 },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchGitlabMergeRequests('assigned')).rejects.toMatchObject({
      message: 'Invalid filter.',
      status: 400,
      type: 'BAD_REQUEST',
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('retries transient read failures and eventually succeeds', async () => {
    vi.useFakeTimers();
    const request = vi
      .fn()
      .mockRejectedValueOnce(new ApiError('NETWORK', 'offline'))
      .mockResolvedValueOnce({
        data: { success: true, data: 'ok' },
        response: new Response(null, { status: 200 }),
      });

    const result = executeRead(request);
    await vi.advanceTimersByTimeAsync(500);

    await expect(result).resolves.toBe('ok');
    expect(request).toHaveBeenCalledTimes(2);
  });

  it('retries 5xx reads up to three total attempts', async () => {
    vi.useFakeTimers();
    const request = vi.fn().mockResolvedValue({
      error: {
        success: false,
        error: { type: 'INTERNAL', message: 'Unavailable.' },
      },
      response: new Response(null, { status: 503 }),
    });

    const result = executeRead(request);
    const assertion = expect(result).rejects.toMatchObject({
      status: 503,
      type: 'INTERNAL',
    });
    await vi.advanceTimersByTimeAsync(1_500);

    await assertion;
    expect(request).toHaveBeenCalledTimes(3);
  });

  it('does not retry mutations', async () => {
    const request = vi
      .fn()
      .mockRejectedValue(new ApiError('NETWORK', 'offline'));

    await expect(executeMutation(request)).rejects.toMatchObject({
      type: 'NETWORK',
    });
    expect(request).toHaveBeenCalledTimes(1);
  });

  it('preserves abort errors during retry backoff', async () => {
    vi.useFakeTimers();
    const controller = new AbortController();
    const request = vi
      .fn()
      .mockRejectedValue(new ApiError('NETWORK', 'offline'));
    const result = executeRead(request, controller.signal);

    await vi.waitFor(() => expect(request).toHaveBeenCalledTimes(1));
    controller.abort();

    await expect(result).rejects.toMatchObject({ name: 'AbortError' });
    expect(request).toHaveBeenCalledTimes(1);
  });

  it('classifies non-JSON responses as unexpected', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response('<html>Bad gateway</html>', {
          headers: { 'Content-Type': 'text/html' },
          status: 502,
        }),
      ),
    );

    await expect(fetchGitlabMergeRequests('assigned')).rejects.toEqual(
      expect.objectContaining({ type: 'UNEXPECTED' }),
    );
  });
});

function makeAttentionItem() {
  return {
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
