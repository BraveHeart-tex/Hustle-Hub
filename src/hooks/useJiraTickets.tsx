import { useCallback, useEffect, useState } from 'react';

import { JiraFilter } from '@/lib/constants';
import { JiraIssue } from '@/types/jira';

export interface UseJiraTicketsState {
  isLoading: boolean;
  isUnauthorized: boolean;
  isError: boolean;
  errorMessage?: string;
  issues: JiraIssue[];
}

export const useJiraTickets = (filter: JiraFilter) => {
  const [state, setState] = useState<UseJiraTicketsState>({
    isLoading: true,
    isUnauthorized: false,
    isError: false,
    issues: [],
  });

  const fetchData = useCallback(async () => {
    setState((s) => ({ ...s, isLoading: true }));
    try {
      const res = await fetch(
        `http://localhost:3001/api/data/jira/tickets?filter=${filter}`,
      );
      const data = await res.json();

      if (data.success) {
        setState({
          isLoading: false,
          isUnauthorized: false,
          isError: false,
          issues: data.data.issues,
        });
      } else {
        setState({
          isLoading: false,
          isUnauthorized: data.error.type === 'UNAUTHORIZED',
          isError: data.error.type === 'INTERNAL',
          errorMessage: data.error.message,
          issues: [],
        });
      }
    } catch (err) {
      console.error('Error fetching GitLab MRs:', err);
      setState({
        isLoading: false,
        isUnauthorized: false,
        isError: true,
        errorMessage: 'Unexpected error',
        issues: [],
      });
    }
  }, [filter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { ...state, refetch: fetchData };
};
