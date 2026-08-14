import { describe, expect, it } from 'vitest';

import { isOwnGitlabMr } from '@/lib/utils/misc/isOwnGitlabMr';

describe('isOwnGitlabMr', () => {
  it('is true when the author id matches the current user id', () => {
    expect(isOwnGitlabMr(28408582, '28408582')).toBe(true);
  });

  it('is false when the author id does not match the current user id', () => {
    expect(isOwnGitlabMr(12, '28408582')).toBe(false);
  });

  it('is true when the current user id is undefined', () => {
    expect(isOwnGitlabMr(12, undefined)).toBe(true);
  });

  it('is true when the current user id is an empty string', () => {
    expect(isOwnGitlabMr(12, '')).toBe(true);
  });

  it('is true when the current user id is not numeric', () => {
    expect(isOwnGitlabMr(12, 'not-a-number')).toBe(true);
  });
});
