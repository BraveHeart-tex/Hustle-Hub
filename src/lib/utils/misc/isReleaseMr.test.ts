import { describe, expect, it } from 'vitest';

import { isReleaseMr } from '@/lib/utils/misc/isReleaseMr';
import { type GitlabMergeRequest } from '@/types/gitlab';

const mrWithLabels = (
  labels: GitlabMergeRequest['labels'],
): GitlabMergeRequest => ({ labels }) as GitlabMergeRequest;

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
});
