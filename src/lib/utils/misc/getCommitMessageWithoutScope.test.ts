import { describe, expect, it } from 'vitest';

import { getCommitMessageWithoutScope } from '@/lib/utils/misc/getCommitMessageWithoutScope';

describe('getCommitMessageWithoutScope', () => {
  it('returns a plain message unchanged', () => {
    expect(getCommitMessageWithoutScope('fix bug')).toBe('fix bug');
  });

  it('strips a Jira-id prefix', () => {
    expect(getCommitMessageWithoutScope('JIRA-123: fix bug')).toBe('fix bug');
  });

  it('strips a conventional commit prefix', () => {
    expect(getCommitMessageWithoutScope('feat: fix bug')).toBe('fix bug');
  });

  it('strips an already-applied release prefix with a message', () => {
    expect(
      getCommitMessageWithoutScope('Production Release For JIRA-123: fix bug'),
    ).toBe('fix bug');
  });

  it('strips a bare already-applied release prefix with no message', () => {
    expect(
      getCommitMessageWithoutScope('Production Release For JIRA-123'),
    ).toBe('');
  });

  it('strips a release prefix with an empty jira id', () => {
    expect(
      getCommitMessageWithoutScope('Production Release For : fix bug'),
    ).toBe('fix bug');
  });
});
