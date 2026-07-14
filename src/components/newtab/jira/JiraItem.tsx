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

// Status indicator dot color keyed by statusCategory.colorName
const STATUS_DOT: Record<string, string> = {
  red: 'bg-destructive',
  yellow: 'bg-warning',
  green: 'bg-success',
};

const getStatusDotClass = (colorName: string) =>
  STATUS_DOT[colorName] ?? 'bg-muted-foreground/50';

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
        title={fields.summary}
        aria-label={`Open Jira issue ${issue.key}: ${fields.summary}`}
        className="absolute inset-0 rounded-sm outline-none focus-visible:ring-inset focus-visible:ring-ring/50 focus-visible:ring-[3px]"
      />

      <div className="pointer-events-none relative flex items-center justify-between gap-2 mb-1">
        <span className="text-xs font-mono text-muted-foreground shrink-0">
          {issue.key}
        </span>
        <span className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <span
            aria-hidden="true"
            className={cn(
              'size-1.5 shrink-0 rounded-full',
              getStatusDotClass(fields.status.statusCategory.colorName),
            )}
          />
          {fields.status.name}
        </span>
      </div>

      <h3 className="pointer-events-none relative mb-1.5 truncate text-sm font-medium leading-snug">
        {fields.summary}
      </h3>

      <div className="pointer-events-none relative flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
          <img
            src={fields.priority.iconUrl}
            alt=""
            width={12}
            height={12}
            className="block shrink-0"
          />
          <span className="truncate">{fields.priority.name}</span>
        </span>
        <div className="pointer-events-auto relative z-10 flex items-center gap-2">
          <WorkItemComments
            triggerClassName="size-8"
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
