import { useApi } from '@/hooks/useApi';
import { type GitlabFilter, QUERY_KEYS } from '@/lib/constants';
import { ENDPOINTS } from '@/lib/endpoints';
import { getMockGitlabMergeRequests, isMockDataEnabled } from '@/lib/mockData';
import { type ApiResponse } from '@/types/api';
import { type GitlabMergeRequest } from '@/types/gitlab';

interface UseGitlabMrsOptions {
  enabled?: boolean;
}

export const useGitlabMrs = (
  filter: GitlabFilter,
  options?: UseGitlabMrsOptions,
) =>
  useApi(
    QUERY_KEYS.gitlab.mergeRequests(filter),
    async () => {
      if (isMockDataEnabled) {
        return {
          success: true,
          data: getMockGitlabMergeRequests(filter),
        };
      }

      const response = await fetch(ENDPOINTS.gitlab.mergeRequests(filter));

      return (await response.json()) as ApiResponse<GitlabMergeRequest[]>;
    },
    options,
  );
