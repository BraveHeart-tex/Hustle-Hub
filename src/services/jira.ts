import { ENDPOINTS } from '@/lib/endpoints';

export const fetchFerelKey = async (jiraId: string): Promise<string> => {
  try {
    const response = await fetch(ENDPOINTS.jira.getIssueByFeatureKey(jiraId));
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return data.data.issue?.key ?? 'FEREL-TASK_NUMBER_HERE';
  } catch (error) {
    console.warn(`Failed to fetch FEREL key for ${jiraId}:`, error);
    return 'FEREL-TASK_NUMBER_HERE';
  }
};
