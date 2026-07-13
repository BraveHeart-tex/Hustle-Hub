import {
  AlertCircleIcon,
  CheckIcon,
  ChevronDown,
  FileDiffIcon,
  FolderGit2,
  GitBranch,
  MessageSquare,
  ThumbsUp,
  WorkflowIcon,
} from 'lucide-react';
import { useId, useState } from 'react';

import { GitlabUserAvatar } from '@/components/newtab/gitlab/GitlabUserAvatar';
import { MrLabel } from '@/components/newtab/gitlab/MRLabel';
import { MrStatusBadge } from '@/components/newtab/gitlab/MrStatusBadge';
import { WorkItemComments } from '@/components/newtab/misc/WorkItemComments';
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
  const [showDetails, setShowDetails] = useState(false);
  const detailsId = useId();
  const hasProblem = mr.conflicts || mr.headPipelineStatus === 'FAILED';
  const shouldHighlightProblem = hasProblem && !mr.draft;
  const draftProblemLabel = mr.conflicts ? 'Conflicts' : 'Failed pipeline';
  const nextAction = getNextAction(mr);

  return (
    <div
      className={cn(
        'group relative rounded-lg border border-border px-3 py-2 motion-safe:transition-colors hover:bg-muted/50 dark:hover:bg-accent/50',
        mr.needsCurrentUserAction &&
          !hasProblem &&
          'border-warning/60 bg-warning/5',
        shouldHighlightProblem && 'border-destructive/60 bg-destructive/5',
      )}
    >
      <a
        href={mr.webUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Open merge request !${mr.iid}: ${mr.title}`}
        className="absolute inset-0 rounded-lg outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px]"
      />

      <div className="pointer-events-none relative">
        <div className="mb-1 flex min-w-0 items-center gap-2">
          <MrStatusBadge status={mr.mergeStatus} draft={mr.draft} />
          {hasProblem && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive">
              <AlertCircleIcon className="size-3" />
              {draftProblemLabel}
            </span>
          )}
          <span className="ml-auto shrink-0 font-mono text-xs text-muted-foreground">
            !{mr.iid}
          </span>
        </div>

        <h3 className="text-sm font-medium leading-snug text-foreground">
          {mr.title}
        </h3>

        <div className="mt-2 flex items-center justify-between gap-3">
          <span className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
            <FolderGit2 className="size-3 shrink-0" />
            <span className="truncate">{mr.projectName}</span>
          </span>
          <div className="pointer-events-auto relative z-10 flex shrink-0 items-center gap-1">
            <span
              className={cn(
                'text-xs font-medium',
                hasProblem
                  ? 'text-destructive'
                  : mr.needsCurrentUserAction
                    ? 'text-warning'
                    : 'text-foreground',
              )}
            >
              {nextAction}
            </span>
            <WorkItemComments
              itemMeta={{
                itemId: mr.iid,
                itemType: 'gitlab',
                title: mr.title,
                url: mr.webUrl,
              }}
            />
            <button
              type="button"
              className="inline-flex size-6 items-center justify-center rounded-md text-muted-foreground outline-none motion-safe:transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-ring/50 focus-visible:ring-[3px]"
              aria-label={`${showDetails ? 'Hide' : 'Show'} details for ${mr.title}`}
              aria-expanded={showDetails}
              aria-controls={detailsId}
              onClick={() => setShowDetails((current) => !current)}
            >
              <ChevronDown
                aria-hidden="true"
                className={cn(
                  'size-4 motion-safe:transition-transform motion-safe:duration-150',
                  showDetails && 'rotate-180',
                )}
              />
            </button>
          </div>
        </div>

        {showDetails && (
          <div
            id={detailsId}
            className="mt-2 grid gap-2 border-t border-border/70 pt-2 text-xs text-muted-foreground"
          >
            {mr.labels.length > 0 && (
              <div className="flex flex-wrap items-center gap-1">
                {mr.labels.map((label) => (
                  <MrLabel
                    label={label}
                    key={`${label.title}+${label.color}`}
                  />
                ))}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="flex items-center gap-1">
                <GitBranch className="size-3 shrink-0" />
                {mr.sourceBranch}
                <span className="opacity-40">→</span>
                {mr.targetBranch}
              </span>
              {mr.diffStatsSummary && (
                <span className="flex items-center gap-1 font-mono">
                  <FileDiffIcon className="size-3 shrink-0" />
                  <span className="text-success">
                    +{mr.diffStatsSummary.additions}
                  </span>
                  <span className="text-destructive">
                    -{mr.diffStatsSummary.deletions}
                  </span>
                </span>
              )}
              <span>Created {formatDate(mr.createdAt)}</span>
              {mr.autoMergeEnabled && (
                <span className="flex items-center gap-1 text-info">
                  <WorkflowIcon className="size-3" />
                  Auto-merge enabled
                </span>
              )}
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <GitlabUserAvatar
                  src={mr.author.avatarUrl}
                  className="size-5"
                />
                <span className="truncate">@{mr.author.username}</span>
                {mr.reviewers.length > 0 && (
                  <>
                    <span className="text-muted-foreground/30">·</span>
                    <div
                      className="flex items-center gap-1"
                      aria-label={`${mr.reviewers.length} reviewers`}
                    >
                      {mr.reviewers.map((reviewer) => (
                        <div
                          key={reviewer.id}
                          className="relative inline-block"
                        >
                          <GitlabUserAvatar
                            src={reviewer.avatarUrl}
                            className="size-5"
                          />
                          {reviewer.hasApproved && (
                            <CheckIcon className="absolute -bottom-1 -right-1 size-3 rounded-full border border-background bg-success p-px text-success-foreground" />
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <span className="flex items-center gap-1">
                  <ThumbsUp className="size-3" />
                  {mr.approvedBy}/{mr.approvalsRequired}
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="size-3" />
                  {mr.userNotesCount}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
