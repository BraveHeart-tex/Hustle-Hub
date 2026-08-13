import { describe, expect, it } from 'vitest';

import { isNeedsReboundMr } from '@/lib/utils/misc/isNeedsReboundMr';
import { type GitlabMergeRequest } from '@/types/gitlab';

const mrWithLabels = (
  labels: GitlabMergeRequest['labels'],
): GitlabMergeRequest => ({ labels }) as GitlabMergeRequest;

describe('isNeedsReboundMr', () => {
  it('is true when the MR has the review::needs-rebound label', () => {
    const mergeRequest = mrWithLabels([
      { title: 'review::needs-rebound', color: '#c5def5' },
    ]);

    expect(isNeedsReboundMr(mergeRequest)).toBe(true);
  });

  it('is false when the MR has no labels', () => {
    const mergeRequest = mrWithLabels([]);

    expect(isNeedsReboundMr(mergeRequest)).toBe(false);
  });

  it('is false when the MR has unrelated labels only', () => {
    const mergeRequest = mrWithLabels([
      { title: 'frontend', color: '#1f75cb' },
      { title: 'target::staging', color: '#c5def5' },
    ]);

    expect(isNeedsReboundMr(mergeRequest)).toBe(false);
  });

  it('is true when review::needs-rebound is one of several labels', () => {
    const mergeRequest = mrWithLabels([
      { title: 'frontend', color: '#1f75cb' },
      { title: 'review::needs-rebound', color: '#c5def5' },
    ]);

    expect(isNeedsReboundMr(mergeRequest)).toBe(true);
  });
});
