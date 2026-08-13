import { type GitlabMergeRequest } from '@/types/gitlab';

const NEEDS_REBOUND_LABEL_TITLE = 'review::needs-rebound';

export const isNeedsReboundMr = (mergeRequest: GitlabMergeRequest) =>
  mergeRequest.labels.some(
    (label) => label.title === NEEDS_REBOUND_LABEL_TITLE,
  );
