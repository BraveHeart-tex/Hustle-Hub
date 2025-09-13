import { useCallback, useEffect, useState } from 'react';

import { ENDPOINTS } from '@/lib/endpoints';
import { GitlabAPIResponse, GitLabMergeRequest } from '@/types/gitlab';

export interface UseGitlabMrsState {
  isLoading: boolean;
  isUnauthorized: boolean;
  isError: boolean;
  errorMessage?: string;
  assigned: GitLabMergeRequest[];
  review: GitLabMergeRequest[];
}

export const useGitlabMrs = () => {
  const [state, setState] = useState<UseGitlabMrsState>({
    isLoading: true,
    isUnauthorized: false,
    isError: false,
    assigned: [],
    review: [],
  });

  const fetchData = useCallback(async () => {
    setState((s) => ({ ...s, isLoading: true }));
    try {
      const res = await fetch(ENDPOINTS.GITLAB_MRS);
      const data: GitlabAPIResponse = await res.json();

      if (data.success) {
        setState({
          isLoading: false,
          isUnauthorized: false,
          isError: false,
          assigned: data.data.assigned,
          review: data.data.review,
        });
      } else {
        setState({
          isLoading: false,
          isUnauthorized: data.error.type === 'UNAUTHORIZED',
          isError: data.error.type === 'INTERNAL',
          errorMessage: data.error.message,
          assigned: [],
          review: [],
        });
      }
    } catch (err) {
      console.error('Error fetching GitLab MRs:', err);
      setState({
        isLoading: false,
        isUnauthorized: false,
        isError: true,
        errorMessage: 'Unexpected error',
        assigned: [],
        review: [],
      });
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { ...state, refetch: fetchData };
};
