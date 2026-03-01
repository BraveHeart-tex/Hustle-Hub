import '@/assets/tailwind.css';

import { StrictMode } from 'react';

import { BottomRightPanel } from '@/components/mr-thread-ui/BottomRightPanel';
import { JiraQuickLink } from '@/components/mr-thread-ui/JiraQuickLink';
import { ThreadList } from '@/components/mr-thread-ui/ThreadList';
import { getJiraTaskUrl } from '@/lib/utils/misc/getJiraTaskUrl';

export const MrThreadApp = ({
  container,
  gitlabUserId,
  jiraId,
}: {
  container: HTMLElement;
  gitlabUserId: string;
  jiraId?: string;
}) => {
  return (
    <StrictMode>
      <BottomRightPanel className="flex items-center gap-2">
        <JiraQuickLink jiraLink={jiraId ? getJiraTaskUrl(jiraId) : ''} />
        <ThreadList container={container} userId={gitlabUserId} />
      </BottomRightPanel>
    </StrictMode>
  );
};
