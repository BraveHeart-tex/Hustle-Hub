import '@/assets/tailwind.css';

import { StrictMode, useEffect } from 'react';

import { BottomRightPanel } from '@/components/mr-thread-panel/BottomRightPanel';
import { CodeReviewCommandsShortcut } from '@/components/mr-thread-panel/CodeReviewCommandsShortcut';
import { JiraStatusButton } from '@/components/mr-thread-panel/JiraStatusButton';
import { ThreadList } from '@/components/mr-thread-panel/ThreadList';
import { useGitLabMrPageSnapshot } from '@/lib/gitlab-mr-page/gitlabMrPageReact';
import { extractJiraId } from '@/lib/utils/misc/extractJiraId';
import { getJiraTaskUrl } from '@/lib/utils/misc/getJiraTaskUrl';

export const MrThreadApp = ({
  container,
  gitlabUserId,
}: {
  container: HTMLElement;
  gitlabUserId: string;
}) => {
  const pageSnapshot = useGitLabMrPageSnapshot();
  const facts = pageSnapshot.status === 'ready' ? pageSnapshot : null;
  const hostAppearance =
    pageSnapshot.status === 'ready' || pageSnapshot.status === 'loading'
      ? pageSnapshot.hostAppearance
      : null;
  const jiraId = extractJiraId(facts?.title ?? '');
  const usableJiraId = jiraId && jiraId !== 'FE-1' ? jiraId : '';

  // `container` is the Shadow-DOM root that also hosts the portaled popovers,
  // so toggling `dark` here themes both the launchers and their popovers.
  useEffect(() => {
    container.classList.toggle('dark', hostAppearance === 'dark');
  }, [container, hostAppearance]);

  return (
    <StrictMode>
      <BottomRightPanel>
        {/* One segmented control group: a single surface, one border, one
            shadow, and 1px dividers between flat segments. */}
        <div className="inline-flex max-w-[calc(100vw-3rem)] items-stretch divide-x divide-border overflow-hidden rounded-xl border bg-popover shadow-floating">
          <JiraStatusButton
            container={container}
            gitlabUserId={gitlabUserId}
            jiraId={usableJiraId}
            jiraLink={usableJiraId ? getJiraTaskUrl(usableJiraId) : ''}
            assigneeIds={facts?.assigneeIds ?? null}
            description={facts?.description ?? null}
            mrUrl={facts?.identity.href ?? null}
            targetBranch={facts?.targetBranch ?? null}
          />
          <ThreadList container={container} userId={gitlabUserId} />
          <CodeReviewCommandsShortcut
            container={container}
            jiraId={usableJiraId}
          />
        </div>
      </BottomRightPanel>
    </StrictMode>
  );
};
