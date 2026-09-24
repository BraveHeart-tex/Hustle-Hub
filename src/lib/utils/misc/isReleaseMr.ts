import { type GitlabMergeRequest } from '@/types/gitlab';

const RELEASE_LABEL_TITLE = 'target::production';

export const isReleaseMr = (mergeRequest: GitlabMergeRequest) =>
  mergeRequest.targetBranch === 'main' ||
  mergeRequest.labels.some((label) => label.title === RELEASE_LABEL_TITLE);
