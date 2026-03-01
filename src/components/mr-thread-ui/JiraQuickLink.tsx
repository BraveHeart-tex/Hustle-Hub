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
        variant: 'outline',
        size: 'sm',
        className: 'rounded-full shadow-sm gap-1.5 h-auto py-1.5',
      })}
    >
      <JiraIcon className="h-3.5 w-3.5 shrink-0" />
      <div className="flex flex-col items-start leading-tight">
        <span className="text-xs">Jira Task</span>
        <span className="text-[10px] text-muted-foreground font-medium">
          Open in Jira
        </span>
      </div>
    </a>
  );
};
