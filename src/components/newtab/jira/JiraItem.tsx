import { CheckSquare, ClipboardCopyIcon } from 'lucide-react';
import { useState } from 'react';

import { WorkItemComments } from '@/components/newtab/misc/WorkItemComments';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { getJiraTaskUrl } from '@/lib/utils/misc/getJiraTaskUrl';
import { type JiraIssue } from '@/types/jira';

// Status badge styles keyed by statusCategory.colorName
const STATUS_BADGE: Record<string, string> = {
  red: 'bg-destructive/10 text-destructive border-destructive/20',
  yellow: 'bg-warning/10 text-warning border-warning/20',
  green: 'bg-success/10 text-success border-success/20',
};

const getStatusBadgeClass = (colorName: string) =>
  STATUS_BADGE[colorName] ?? 'bg-muted text-muted-foreground border-border';

interface JiraItemProps {
  issue: JiraIssue;
}

export const JiraItem = ({ issue }: JiraItemProps) => {
  const [isCopied, setIsCopied] = useState(false);
  const [copyError, setCopyError] = useState('');
  const [isCopying, setIsCopying] = useState(false);
  const { fields } = issue;
  const issueUrl = getJiraTaskUrl(issue.key);

  const copyTaskLinkToClipboard = async () => {
    setCopyError('');
    setIsCopying(true);
    try {
      await navigator.clipboard.writeText(issueUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error(error);
      setCopyError('Could not copy the Jira link. Try again.');
    } finally {
      setIsCopying(false);
    }
  };

  return (
    <div className="group relative px-3 py-3 hover:bg-muted/50 dark:hover:bg-accent/50 motion-safe:transition-colors">
      <a
        href={issueUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Open Jira issue ${issue.key}: ${fields.summary}`}
        className="absolute inset-0 rounded-sm outline-none focus-visible:ring-inset focus-visible:ring-ring/50 focus-visible:ring-[3px]"
      />

      <div className="pointer-events-none relative flex items-center justify-between gap-2 mb-1">
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

      <h3 className="pointer-events-none relative text-sm font-medium leading-snug mb-1.5">
        {fields.summary}
      </h3>

      <div className="pointer-events-none relative flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <img src={fields.priority.iconUrl} alt="" width={12} height={12} />
          {fields.priority.name}
        </span>
        <div className="pointer-events-auto relative z-10 flex items-center gap-2">
          <WorkItemComments
            triggerClassName="size-6"
            itemMeta={{
              itemId: issue.id,
              itemType: 'jira',
              title: fields.summary,
              url: getJiraTaskUrl(issue.key),
            }}
          />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="relative size-6 text-muted-foreground"
                  onClick={() => void copyTaskLinkToClipboard()}
                  loading={isCopying}
                  aria-label={
                    isCopied
                      ? `Copied link for Jira issue ${issue.key}`
                      : `Copy link for Jira issue ${issue.key}`
                  }
                >
                  {isCopied ? (
                    <CheckSquare aria-hidden="true" />
                  ) : (
                    <ClipboardCopyIcon aria-hidden="true" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isCopied ? 'Link copied' : 'Copy Jira link'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      {copyError && (
        <p
          role="status"
          aria-live="polite"
          className="pointer-events-none relative mt-1 text-xs text-destructive"
        >
          {copyError}
        </p>
      )}
    </div>
  );
};
