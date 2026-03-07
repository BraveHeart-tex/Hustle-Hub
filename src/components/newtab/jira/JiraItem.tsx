import { CheckSquare, ClipboardCopyIcon } from 'lucide-react';
import { MouseEvent, useState } from 'react';
import { toast } from 'sonner';

import WorkItemComments from '@/components/newtab/misc/WorkItemComments';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getJiraTaskUrl } from '@/lib/utils/misc/getJiraTaskUrl';
import { JiraIssue } from '@/types/jira';

// Status badge styles keyed by statusCategory.colorName
const STATUS_BADGE: Record<string, string> = {
  red: 'bg-destructive/10 text-destructive border-destructive/20',
  yellow: 'bg-amber-400/10 text-amber-500 border-amber-400/20',
  green:
    'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
};

const getStatusBadgeClass = (colorName: string) =>
  STATUS_BADGE[colorName] ?? 'bg-muted text-muted-foreground border-border';

interface JiraItemProps {
  issue: JiraIssue;
}

const JiraItem = ({ issue }: JiraItemProps) => {
  const [isCopied, setIsCopied] = useState(false);
  const { fields } = issue;

  const handleIssueClick = () => {
    window.open(getJiraTaskUrl(issue.key), '_blank');
  };

  const copyTaskLinkToClipboard = async (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(getJiraTaskUrl(issue.key));
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error(error);
      toast.error('Failed to copy task link to clipboard');
    }
  };

  return (
    <div
      className="px-3 py-2 rounded-lg border border-border hover:bg-muted/50 dark:hover:bg-accent/50 transition-colors cursor-pointer"
      onClick={handleIssueClick}
    >
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="text-xs font-mono text-muted-foreground shrink-0">
          {issue.key}
        </span>
        <span
          className={cn(
            'text-[10px] font-medium border rounded px-1.5 py-px leading-none shrink-0',
            getStatusBadgeClass(fields.status.statusCategory.colorName),
          )}
        >
          {fields.status.name}
        </span>
      </div>

      <h3 className="text-sm font-medium leading-snug mb-1.5">
        {fields.summary}
      </h3>

      <div className="flex items-center justify-end gap-2 transition-opacity">
        <WorkItemComments
          itemMeta={{
            itemId: issue.id,
            itemType: 'jira',
            title: fields.summary,
            url: getJiraTaskUrl(issue.key),
          }}
        />
        <Button
          size="icon"
          variant="ghost"
          className="size-4 relative text-muted-foreground"
          onClick={copyTaskLinkToClipboard}
        >
          {isCopied ? <CheckSquare /> : <ClipboardCopyIcon />}
        </Button>
      </div>
    </div>
  );
};

export default JiraItem;
