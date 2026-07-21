import '@/assets/tailwind.css';

import { StrictMode } from 'react';

import { BottomRightPanel } from '@/components/mr-thread-panel/BottomRightPanel';
import { CodeReviewCommandsShortcut } from '@/components/mr-thread-panel/CodeReviewCommandsShortcut';
import { JiraStatusButton } from '@/components/mr-thread-panel/JiraStatusButton';
import { ThreadList } from '@/components/mr-thread-panel/ThreadList';
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
        <JiraStatusButton
          container={container}
          gitlabUserId={gitlabUserId}
          jiraId={jiraId && jiraId !== 'FE-1' ? jiraId : ''}
          jiraLink={jiraId && jiraId !== 'FE-1' ? getJiraTaskUrl(jiraId) : ''}
        />
        <ThreadList container={container} userId={gitlabUserId} />
        <CodeReviewCommandsShortcut
          container={container}
          jiraId={jiraId && jiraId !== 'FE-1' ? jiraId : ''}
        />
      </BottomRightPanel>
    </StrictMode>
  );
};
