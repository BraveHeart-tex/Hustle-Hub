import { useApi } from '@/hooks/useApi';
import { type GitlabFilter, QUERY_KEYS } from '@/lib/constants';
import { getMockGitlabMergeRequests, isMockDataEnabled } from '@/lib/mockData';
import { fetchGitlabMergeRequests } from '@/services/gitlab';

interface UseGitlabMrsOptions {
  enabled?: boolean;
}

export const useGitlabMrs = (
  filter: GitlabFilter,
  options?: UseGitlabMrsOptions,
) =>
  useApi(
    QUERY_KEYS.gitlab.mergeRequests(filter),
    async (signal) => {
      if (isMockDataEnabled) {
        return getMockGitlabMergeRequests(filter);
      }

      return fetchGitlabMergeRequests(filter, signal);
    },
    options,
  );
