import {
  AlertCircleIcon,
  CheckIcon,
  Clock,
  FileDiffIcon,
  FolderGit2,
  GitBranch,
  MessageSquare,
  ThumbsUp,
} from 'lucide-react';

import { GitlabUserAvatar } from '@/components/newtab/gitlab/GitlabUserAvatar';
import { MrLabel } from '@/components/newtab/gitlab/MRLabel';
import { MrStatusBadge } from '@/components/newtab/gitlab/MrStatusBadge';
import { WorkItemComments } from '@/components/newtab/misc/WorkItemComments';
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

const MAX_VISIBLE_REVIEWERS = 5;

export const MRItem = ({ mr }: MRItemProps) => {
  const visibleReviewers = mr.reviewers.slice(0, MAX_VISIBLE_REVIEWERS);
  const hiddenReviewerCount = mr.reviewers.length - visibleReviewers.length;

  const hasProblem = mr.conflicts || mr.headPipelineStatus === 'FAILED';
  const shouldHighlightProblem = hasProblem && !mr.draft;
  const problemLabel = mr.conflicts ? 'Conflicts' : 'Failed pipeline';

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
        title={mr.title}
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

        <h3 className="truncate text-sm font-medium leading-snug text-foreground">
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
        </div>

        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          <Clock aria-label="Created" className="size-3 shrink-0" />
          {formatDate(mr.createdAt)}
        </p>

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
                className="flex shrink-0 items-center"
                role="group"
                aria-label={`${mr.reviewers.length} reviewers`}
              >
                {visibleReviewers.map((reviewer, index) => (
                  <span
                    key={reviewer.id}
                    className="relative -ml-1.5 inline-block first:ml-0"
                    style={{ zIndex: MAX_VISIBLE_REVIEWERS - index }}
                    role="img"
                    aria-label={`Reviewer ${reviewer.id}${reviewer.hasApproved ? ', approved' : ''}`}
                  >
                    <GitlabUserAvatar
                      src={reviewer.avatarUrl}
                      className="size-5 ring-2 ring-background"
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
                {hiddenReviewerCount > 0 && (
                  <span
                    className="-ml-1.5 inline-flex size-5 items-center justify-center rounded-full bg-muted font-mono text-[0.625rem] font-medium text-muted-foreground ring-2 ring-background"
                    role="img"
                    aria-label={`${hiddenReviewerCount} more reviewers`}
                  >
                    +{hiddenReviewerCount}
                  </span>
                )}
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

          <div className="pointer-events-auto relative z-10 flex shrink-0 items-center">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex">
                    <WorkItemComments
                      triggerClassName="size-8"
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
