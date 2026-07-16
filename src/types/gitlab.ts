import type { components } from '@/generated/openapi';

export type GitlabMergeRequest = components['schemas']['GitlabMergeRequest'];
export type GitlabTagDetails = components['schemas']['GitlabTagDetails'];
export type MergeStatus = GitlabMergeRequest['mergeStatus'];
