import '@/assets/tailwind.css';

import { StrictMode } from 'react';

import { BottomRightPanel } from '@/components/mr-thread-panel/BottomRightPanel';
import { ThreadList } from '@/components/mr-thread-panel/ThreadList';
import { getJiraTaskUrl } from '@/lib/utils/misc/getJiraTaskUrl';

import { MrWarnings } from '../mr-warnings/MrWarnings';
import { CodeReviewCommandsShortcut } from './CodeReviewCommandsShortcut';
import { JiraStatusButton } from './JiraStatusButton';

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
        <MrWarnings container={container} />
        <JiraStatusButton
          container={container}
          jiraId={jiraId && jiraId !== 'FE-1' ? jiraId : ''}
          jiraLink={jiraId && jiraId !== 'FE-1' ? getJiraTaskUrl(jiraId) : ''}
        />
        <ThreadList container={container} userId={gitlabUserId} />
        <CodeReviewCommandsShortcut container={container} />
      </BottomRightPanel>
    </StrictMode>
  );
};
