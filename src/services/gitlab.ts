import { GitLabMRResponse } from '@/types/gitlab';

const GITLAB_API_URL = 'https://gitlab.com/api/v4';

export const fetchStats = async (): Promise<GitLabMRResponse> => {
  const [assignedResponse, reviewResponse] = await Promise.all([
    fetch(
      `${GITLAB_API_URL}/merge_requests?state=opened&assignee_id=${import.meta.env.GITLAB_USER_ID}`,
      {
        headers: {
          'PRIVATE-TOKEN': import.meta.env.GITLAB_PRIVATE_TOKEN!,
        },
      },
    ),
    fetch(
      `${GITLAB_API_URL}/merge_requests?state=opened&scope=all&reviewer_id=${import.meta.env.GITLAB_USER_ID}`,
      {
        headers: {
          'PRIVATE-TOKEN': import.meta.env.GITLAB_PRIVATE_TOKEN!,
        },
      },
    ),
  ]);

  const [assigned, review] = await Promise.all([
    assignedResponse.json(),
    reviewResponse.json(),
  ]);

  return {
    assigned,
    review,
  };
};
