export interface GitlabLabel {
  id: number;
  name: string;
  color: string;
  text_color: string;
  description: string | null;
}

export const fetchProjectLabels = async (): Promise<GitlabLabel[]> => {
  const projectId = document.body.getAttribute('data-project-id');
  if (!projectId) return [];

  const csrfToken =
    document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
      ?.content ?? '';

  const response = await fetch(
    `/api/v4/projects/${projectId}/labels?per_page=100`,
    {
      credentials: 'include',
      headers: {
        'X-CSRF-Token': csrfToken,
        'Content-Type': 'application/json',
      },
    },
  );

  if (!response.ok)
    throw new Error(`Failed to fetch labels: ${response.status}`);
  return response.json();
};
