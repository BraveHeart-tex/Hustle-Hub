import { describe, expect, it } from 'vitest';

import { extractJiraId } from '@/lib/utils/misc/extractJiraId';

describe('extractJiraId', () => {
  it('recognizes Jira project keys containing digits', () => {
    expect(extractJiraId('ABC2-123: Keep this title')).toBe('ABC2-123');
  });
});
