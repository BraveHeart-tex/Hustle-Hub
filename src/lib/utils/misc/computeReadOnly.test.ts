import { describe, expect, it } from 'vitest';

import { computeReadOnly } from '@/lib/utils/misc/computeReadOnly';

describe('computeReadOnly', () => {
  it('returns false when userId is empty, even if assignees are present', () => {
    expect(computeReadOnly('', ['1', '2'])).toBe(false);
  });

  it('returns false when assigneeIds is empty', () => {
    expect(computeReadOnly('1', [])).toBe(false);
  });

  it('returns false when userId is among the assigneeIds', () => {
    expect(computeReadOnly('1', ['1', '2'])).toBe(false);
  });

  it('returns true when assigneeIds is non-empty and userId is not among them', () => {
    expect(computeReadOnly('3', ['1', '2'])).toBe(true);
  });
});
