import { describe, expect, it } from 'vitest';

import { isReleaseMr } from '@/lib/utils/misc/isReleaseMr';
import { type GitlabMergeRequest } from '@/types/gitlab';

const mrWithLabels = (
  labels: GitlabMergeRequest['labels'],
): GitlabMergeRequest => ({ labels }) as GitlabMergeRequest;

const mrWithTargetBranch = (
  targetBranch: GitlabMergeRequest['targetBranch'],
): GitlabMergeRequest =>
  ({ targetBranch, labels: [] }) as unknown as GitlabMergeRequest;

describe('isReleaseMr', () => {
  it('is true when the MR has the target::production label', () => {
    const mergeRequest = mrWithLabels([
      { title: 'target::production', color: '#c5def5' },
    ]);

    expect(isReleaseMr(mergeRequest)).toBe(true);
  });

  it('is false when the MR has no labels', () => {
    const mergeRequest = mrWithLabels([]);

    expect(isReleaseMr(mergeRequest)).toBe(false);
  });

  it('is false when the MR has unrelated labels only', () => {
    const mergeRequest = mrWithLabels([
      { title: 'frontend', color: '#1f75cb' },
      { title: 'target::staging', color: '#c5def5' },
    ]);

    expect(isReleaseMr(mergeRequest)).toBe(false);
  });

  it('is true when target::production is one of several labels', () => {
    const mergeRequest = mrWithLabels([
      { title: 'frontend', color: '#1f75cb' },
      { title: 'target::production', color: '#c5def5' },
    ]);

    expect(isReleaseMr(mergeRequest)).toBe(true);
  });

  it('is true when the MR targets main branch', () => {
    const mergeRequest = mrWithTargetBranch('main');

    expect(isReleaseMr(mergeRequest)).toBe(true);
  });

  it('is false when the MR targets a branch other than main', () => {
    const mergeRequest = mrWithTargetBranch('develop');

    expect(isReleaseMr(mergeRequest)).toBe(false);
  });

  it('is false when the MR is missing target branch info', () => {
    const mergeRequest = mrWithTargetBranch(undefined as unknown as string);

    expect(isReleaseMr(mergeRequest)).toBe(false);
  });
});
