import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { GITLAB_FILTERS, QUERY_KEYS } from '@/lib/constants';
import { ENDPOINTS } from '@/lib/endpoints';

export const useApproveSyncMrs = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (approvalsByProjectId: Record<string, string[]>) => {
      const response = await fetch(ENDPOINTS.gitlab.approveMergeRequests, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvalsByProjectId }),
      });

      if (!response.ok) {
        const error = (await response.json().catch(() => ({}))) as {
          message?: string;
        };
        throw new Error(
          error.message ?? 'Failed to approve sync merge requests.',
        );
      }

      return response.json();
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.gitlab.mergeRequests(GITLAB_FILTERS.REVIEW),
      });
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.gitlab.mergeRequests(GITLAB_FILTERS.ASSIGNED),
      });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to approve sync merge requests.',
      );
    },
  });
};
