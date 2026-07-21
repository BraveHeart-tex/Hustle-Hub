import '@/assets/tailwind.css';

import { StrictMode, useEffect } from 'react';

import { BottomRightPanel } from '@/components/mr-thread-panel/BottomRightPanel';
import { CodeReviewCommandsShortcut } from '@/components/mr-thread-panel/CodeReviewCommandsShortcut';
import { JiraStatusButton } from '@/components/mr-thread-panel/JiraStatusButton';
import { ThreadList } from '@/components/mr-thread-panel/ThreadList';
import { useHostDarkMode } from '@/hooks/useHostDarkMode';
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
  const isDark = useHostDarkMode();

  // `container` is the Shadow-DOM root that also hosts the portaled popovers,
  // so toggling `dark` here themes both the launchers and their popovers.
  useEffect(() => {
    container.classList.toggle('dark', isDark);
  }, [container, isDark]);

  return (
    <StrictMode>
      <BottomRightPanel>
        {/* One segmented control group: a single surface, one border, one
            shadow, and 1px dividers between flat segments. */}
        <div className="inline-flex max-w-[calc(100vw-3rem)] items-stretch divide-x divide-border overflow-hidden rounded-xl border bg-popover shadow-floating">
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
        </div>
      </BottomRightPanel>
    </StrictMode>
  );
};
