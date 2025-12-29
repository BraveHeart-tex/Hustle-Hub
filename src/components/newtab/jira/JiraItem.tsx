import {
  AlertCircle,
  CheckSquare,
  ClipboardCopyIcon,
  Clock,
} from 'lucide-react';
import { MouseEvent, useState } from 'react';
import { toast } from 'sonner';

import WorkItemComments from '@/components/newtab/misc/WorkItemComments';
import { Button } from '@/components/ui/button';
import { getJiraTaskUrl } from '@/lib/utils/misc/getJiraTaskUrl';
import { JiraIssue } from '@/types/jira';

const getPriorityIcon = (priority: string) => {
  switch (priority) {
    case 'High':
      return <AlertCircle className="h-3 w-3 text-destructive" />;
    case 'Medium':
      return <Clock className="h-3 w-3 text-amber-500" />;
    default:
      return <CheckSquare className="h-3 w-3 text-muted-foreground" />;
  }
};

const getStatusColor = (colorName: string) => {
  switch (colorName) {
    case 'red':
      return 'bg-destructive';
    case 'yellow':
      return 'bg-amber-500';
    case 'green':
      return 'bg-success';
    default:
      return 'bg-muted-foreground';
  }
};

interface JiraItemProps {
  issue: JiraIssue;
}

const JiraItem = ({ issue }: JiraItemProps) => {
  const [isCopied, setIsCopied] = useState(false);
  const { fields } = issue;
  const statusColor = getStatusColor(fields.status.statusCategory.colorName);

  const handleIssueClick = () => {
    window.open(getJiraTaskUrl(issue.key), '_blank');
  };

  const copyTaskLinkToClipboard = async (
    event: MouseEvent<HTMLButtonElement>,
  ) => {
    event.stopPropagation();
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
      key={issue.id}
      className="p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors dark:hover:bg-accent/50 cursor-pointer"
      onClick={handleIssueClick}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground">
            {issue.key}
          </span>
          {getPriorityIcon(fields.priority.name)}
        </div>
        <div className="flex items-center gap-1">
          <div className={`w-2 h-2 rounded-full ${statusColor}`} />
          <span className="text-xs text-muted-foreground">
            {fields.status.name}
          </span>
        </div>
      </div>

      <h3 className="font-medium text-sm text-foreground mb-2 text-balance">
        {fields.summary}
      </h3>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>@{fields.assignee.displayName}</span>
        <div className="flex items-center gap-2">
          <WorkItemComments itemId={issue.id} itemType="jira" />
          <Button
            size={'icon'}
            variant={'ghost'}
            className="size-4 z-10"
            onClick={copyTaskLinkToClipboard}
          >
            {isCopied ? <CheckSquare /> : <ClipboardCopyIcon />}
          </Button>
        </div>
      </div>
    </div>
  );
};
export default JiraItem;
