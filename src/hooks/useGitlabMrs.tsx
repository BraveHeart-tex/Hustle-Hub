import { useApi } from '@/hooks/useApi';
import { GitlabFilter, QUERY_KEYS } from '@/lib/constants';
import { ENDPOINTS } from '@/lib/endpoints';
import { ApiResponse } from '@/types/api';
import { GitlabMergeRequest } from '@/types/gitlab';

export const useGitlabMrs = (filter: GitlabFilter) =>
  useApi(QUERY_KEYS.gitlab.mergeRequests(filter), async () => {
    const response = await fetch(ENDPOINTS.gitlab.mergeRequests(filter));

    return (await response.json()) as ApiResponse<GitlabMergeRequest[]>;
  });
