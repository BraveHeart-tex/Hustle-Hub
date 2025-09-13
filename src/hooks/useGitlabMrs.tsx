import { useApi } from '@/hooks/useApi';
import { QUERY_KEYS } from '@/lib/constants';
import { ENDPOINTS } from '@/lib/endpoints';
import { ApiResponse } from '@/types/api';
import { GitLabMergeRequest } from '@/types/gitlab';

export const useGitlabMrs = () =>
  useApi(QUERY_KEYS.GITLAB_MRS, async () => {
    const response = await fetch(ENDPOINTS.GITLAB_MRS);
    return (await response.json()) as ApiResponse<{
      assigned: GitLabMergeRequest[];
      review: GitLabMergeRequest[];
    }>;
  });
