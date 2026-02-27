import { getJiraTaskUrl } from '@/lib/utils/misc/getJiraTaskUrl';

import JiraIcon from '../misc/JiraIcon';
import { buttonVariants } from '../ui/button';

export const JiraQuickLink = ({ mrTitle }: { mrTitle: string }) => {
  const jiraId = mrTitle.match(/\(([A-Z][A-Z0-9]+-\d+)\)/)?.[1];

  if (!mrTitle) {
    return null;
  }

  return (
    <a
      href={getJiraTaskUrl(jiraId || '')}
      target="_blank"
      rel="noopener noreferrer"
      className={buttonVariants({
        variant: 'secondary',
        className: 'hover:shadow-lg',
      })}
    >
      <JiraIcon /> See Task in Jira
    </a>
  );
};
