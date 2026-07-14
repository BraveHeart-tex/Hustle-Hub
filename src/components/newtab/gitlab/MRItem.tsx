import {
  AlertCircleIcon,
  CheckIcon,
  FileDiffIcon,
  FolderGit2,
  GitBranch,
  MessageSquare,
  ThumbsUp,
  WorkflowIcon,
} from 'lucide-react';

import { GitlabUserAvatar } from '@/components/newtab/gitlab/GitlabUserAvatar';
import { MrLabel } from '@/components/newtab/gitlab/MRLabel';
import { MrStatusBadge } from '@/components/newtab/gitlab/MrStatusBadge';
import { WorkItemComments } from '@/components/newtab/misc/WorkItemComments';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils/formatters/formatDate';
import { type GitlabMergeRequest } from '@/types/gitlab';

interface MRItemProps {
  mr: GitlabMergeRequest;
}

function getNextAction(mr: GitlabMergeRequest): string {
  if (mr.conflicts) return 'Resolve conflicts';
  if (mr.headPipelineStatus === 'FAILED') return 'Fix pipeline';
  if (mr.needsCurrentUserAction) return 'Review MR';
  if (mr.draft) return 'Continue draft';
  if (mr.mergeStatus === 'approved' || mr.mergeStatus === 'can_be_merged') {
    return 'Merge when ready';
  }
  return 'Open MR';
}

export const MRItem = ({ mr }: MRItemProps) => {
  const hasProblem = mr.conflicts || mr.headPipelineStatus === 'FAILED';
  const shouldHighlightProblem = hasProblem && !mr.draft;
  const problemLabel = mr.conflicts ? 'Conflicts' : 'Failed pipeline';
  const nextAction = getNextAction(mr);

  return (
    <article
      className={cn(
        'group relative px-3 py-3 motion-safe:transition-colors hover:bg-muted/50 dark:hover:bg-accent/50',
        mr.needsCurrentUserAction && !hasProblem && 'bg-warning/5',
        shouldHighlightProblem && 'bg-destructive/5',
      )}
    >
      <a
        href={mr.webUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Open merge request !${mr.iid}: ${mr.title}`}
        className="absolute inset-0 rounded-sm outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/50"
      />

      <div className="pointer-events-none relative">
        <div className="mb-1 flex min-w-0 items-center gap-2">
          <MrStatusBadge status={mr.mergeStatus} draft={mr.draft} />
          {hasProblem && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive">
              <AlertCircleIcon aria-hidden="true" className="size-3" />
              {problemLabel}
            </span>
          )}
          <span className="ml-auto shrink-0 font-mono text-xs text-muted-foreground">
            !{mr.iid}
          </span>
        </div>

        <h3 className="text-sm font-medium leading-snug text-foreground">
          {mr.title}
        </h3>

        {mr.labels.length > 0 && (
          <div className="mt-1.5 flex flex-wrap items-center gap-1">
            {mr.labels.map((label) => (
              <MrLabel label={label} key={`${label.title}+${label.color}`} />
            ))}
          </div>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="flex min-w-0 items-center gap-1">
            <FolderGit2 aria-hidden="true" className="size-3 shrink-0" />
            <span className="truncate">{mr.projectName}</span>
          </span>
          <span className="flex min-w-0 items-center gap-1">
            <GitBranch aria-hidden="true" className="size-3 shrink-0" />
            <span className="max-w-44 truncate">{mr.sourceBranch}</span>
            <span className="opacity-40">→</span>
            <span className="truncate">{mr.targetBranch}</span>
          </span>
          <span>Created {formatDate(mr.createdAt)}</span>
          {mr.diffStatsSummary && (
            <span className="flex items-center gap-1 font-mono">
              <FileDiffIcon aria-hidden="true" className="size-3 shrink-0" />
              <span className="text-success">
                +{mr.diffStatsSummary.additions}
              </span>
              <span className="text-destructive">
                -{mr.diffStatsSummary.deletions}
              </span>
            </span>
          )}
          {mr.autoMergeEnabled && (
            <span className="flex items-center gap-1 text-info">
              <WorkflowIcon aria-hidden="true" className="size-3" />
              Auto-merge enabled
            </span>
          )}
        </div>

        <div className="mt-2 flex items-end justify-between gap-3 border-t border-border/60 pt-2">
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="flex min-w-0 items-center gap-1.5">
              <GitlabUserAvatar
                src={mr.author.avatarUrl}
                className="size-5"
                alt=""
              />
              <span className="truncate">@{mr.author.username}</span>
            </span>
            {mr.reviewers.length > 0 && (
              <span
                className="flex items-center gap-1"
                role="group"
                aria-label={`${mr.reviewers.length} reviewers`}
              >
                {mr.reviewers.map((reviewer) => (
                  <span
                    key={reviewer.id}
                    className="relative inline-block"
                    role="img"
                    aria-label={`Reviewer ${reviewer.id}${reviewer.hasApproved ? ', approved' : ''}`}
                  >
                    <GitlabUserAvatar
                      src={reviewer.avatarUrl}
                      className="size-5"
                      alt=""
                    />
                    {reviewer.hasApproved && (
                      <CheckIcon
                        aria-hidden="true"
                        className="absolute -bottom-1 -right-1 size-3 rounded-full border border-background bg-success p-px text-success-foreground"
                      />
                    )}
                  </span>
                ))}
              </span>
            )}
            <span className="flex items-center gap-1">
              <ThumbsUp aria-hidden="true" className="size-3" />
              {mr.approvedBy}/{mr.approvalsRequired}
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare aria-hidden="true" className="size-3" />
              {mr.userNotesCount}
            </span>
          </div>

          <div className="pointer-events-auto relative z-10 flex shrink-0 items-center gap-2">
            <Button
              asChild
              size="sm"
              variant={hasProblem ? 'outline' : 'default'}
              className={cn(
                'h-7 text-xs',
                hasProblem &&
                  'text-destructive hover:bg-destructive/10 hover:text-destructive',
              )}
            >
              <a href={mr.webUrl} target="_blank" rel="noopener noreferrer">
                {nextAction}
              </a>
            </Button>
            <span className="h-5 w-px bg-border" aria-hidden="true" />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex">
                    <WorkItemComments
                      triggerClassName="size-7"
                      itemMeta={{
                        itemId: mr.iid,
                        itemType: 'gitlab',
                        title: mr.title,
                        url: mr.webUrl,
                      }}
                    />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top">Comments</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
    </article>
  );
};
