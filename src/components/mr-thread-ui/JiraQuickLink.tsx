import JiraIcon from '../misc/JiraIcon';
import { buttonVariants } from '../ui/button';

export const JiraQuickLink = ({ jiraLink }: { jiraLink: string }) => {
  if (!jiraLink) {
    return null;
  }

  return (
    <a
      href={jiraLink}
      target="_blank"
      rel="noopener noreferrer"
      className={buttonVariants({
        variant: 'secondary',
        className: 'shadow-lg hover:shadow-xl',
      })}
    >
      <JiraIcon /> See Task in Jira
    </a>
  );
};
