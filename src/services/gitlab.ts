import type { GitlabFilter } from '@/lib/constants';
import { apiClient, executeRead } from '@/services/api/client';
import type { GitlabMergeRequest, GitlabTagDetails } from '@/types/gitlab';

export function fetchGitlabMergeRequests(
  filter: GitlabFilter,
  signal?: AbortSignal,
): Promise<GitlabMergeRequest[]> {
  return executeRead(
    () =>
      apiClient.GET('/api/data/gitlab/merge-requests/', {
        params: { query: { filter } },
        signal,
      }),
    signal,
  );
}

export function fetchGitlabTagDetails(
  {
    projectPath,
    tag,
  }: {
    projectPath: string;
    tag: string;
  },
  signal?: AbortSignal,
): Promise<GitlabTagDetails> {
  return executeRead(
    () =>
      apiClient.GET('/api/data/gitlab/tag-details/', {
        params: { query: { fullPath: projectPath, tag } },
        signal,
      }),
    signal,
  );
}
