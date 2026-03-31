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

import GitlabUserAvatar from '@/components/newtab/gitlab/GitlabUserAvatar';
import MrStatusBadge from '@/components/newtab/gitlab/MrStatusBadge';
import MRStatusIcon from '@/components/newtab/gitlab/MRStatusIcon';
import WorkItemComments from '@/components/newtab/misc/WorkItemComments';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils/formatters/formatDate';
import { type GitlabMergeRequest } from '@/types/gitlab';

import MrLabel from './MRLabel';

interface MRItemProps {
  mr: GitlabMergeRequest;
}

const MRItem = ({ mr }: MRItemProps) => {
  const hasProblem = mr.conflicts || mr.headPipelineStatus === 'FAILED';
  const shouldHighlightProblem = hasProblem && !mr.draft;
  const draftProblemLabel = mr.conflicts ? 'Conflicts' : 'Failed pipeline';

  return (
    <a href={mr.webUrl} target="_blank" rel="noopener noreferrer">
      <div
        className={cn(
          'px-3 py-2 rounded-lg border border-border hover:bg-muted/50 dark:hover:bg-accent/50 transition-colors cursor-pointer relative',
          mr.needsCurrentUserAction &&
            !hasProblem &&
            'border-yellow-500 dark:border-yellow-700 border-2',
          shouldHighlightProblem && 'border-destructive border-2',
        )}
      >
        {mr.needsCurrentUserAction && !hasProblem && (
          <MRStatusIcon
            title="Action required"
            variant="warning"
            icon={<AlertCircleIcon className="w-4 h-4" />}
          />
        )}
        {shouldHighlightProblem && (
          <MRStatusIcon
            title={mr.conflicts ? 'This MR has conflicts' : 'Pipeline failed'}
            variant="destructive"
            icon={<AlertCircleIcon />}
          />
        )}

        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-xs font-mono text-muted-foreground shrink-0">
              !{mr.iid}
            </span>
            <MrStatusBadge status={mr.mergeStatus} draft={mr.draft} />
            {mr.autoMergeEnabled && (
              <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium shrink-0">
                <WorkflowIcon className="size-3" />
                Auto-merge
              </span>
            )}
          </div>
          <span className="text-xs text-muted-foreground shrink-0">
            {formatDate(mr.createdAt)}
          </span>
        </div>

        {mr.draft && hasProblem && (
          <div className="mb-1.5 flex items-center">
            <span className="inline-flex items-center gap-1 rounded-md border border-destructive/25 bg-destructive/8 px-1.5 py-0.5 text-[10px] font-medium text-destructive">
              <AlertCircleIcon className="size-3" />
              {draftProblemLabel}
            </span>
          </div>
        )}

        <h3 className="font-medium text-sm text-foreground mb-1 leading-snug">
          {mr.title}
        </h3>

        {mr.labels && mr.labels.length > 0 && (
          <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
            {mr.labels.map((label) => (
              <MrLabel label={label} key={`${label.title}+${label.color}`} />
            ))}
          </div>
        )}

        <div className="flex items-center gap-3 text-[11px] text-muted-foreground mb-1.5 flex-wrap">
          <span className="flex items-center gap-1">
            <FolderGit2 className="size-3 shrink-0" />
            {mr.projectName}
          </span>
          <span className="flex items-center gap-1">
            <GitBranch className="size-3 shrink-0" />
            {mr.sourceBranch}
            <span className="opacity-40">→</span>
            {mr.targetBranch}
          </span>
          {mr.diffStatsSummary && (
            <span className="flex items-center gap-1 font-mono">
              <FileDiffIcon className="size-3 shrink-0" />
              <span className="text-green-600/60 dark:text-green-400/60">
                +{mr.diffStatsSummary.additions}
              </span>
              <span className="text-destructive/60">
                -{mr.diffStatsSummary.deletions}
              </span>
            </span>
          )}
        </div>

        {/* Row 5: Author + reviewers left, stats right */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <GitlabUserAvatar src={mr.author.avatarUrl} className="w-5 h-5" />
            <span className="text-xs text-muted-foreground">
              @{mr.author.username}
            </span>
            {mr.reviewers && mr.reviewers.length > 0 && (
              <>
                <span className="text-muted-foreground/30 text-xs">·</span>
                <div className="flex items-center gap-1">
                  {mr.reviewers.map((reviewer) => (
                    <div key={reviewer.id} className="relative inline-block">
                      <GitlabUserAvatar
                        src={reviewer.avatarUrl}
                        className="w-5 h-5"
                      />
                      {reviewer.hasApproved && (
                        <CheckIcon className="absolute -bottom-1 -right-1 w-3 h-3 text-white bg-green-500 dark:bg-green-700 rounded-full p-px border border-background" />
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <ThumbsUp className="size-3" />
              {mr.approvedBy}/{mr.approvalsRequired}
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare className="size-3" />
              {mr.userNotesCount}
            </span>
            <WorkItemComments
              itemMeta={{
                itemId: mr.iid,
                itemType: 'gitlab',
                title: mr.title,
                url: mr.webUrl,
              }}
              preventDefaultOnClick
            />
          </div>
        </div>
      </div>
    </a>
  );
};

export default MRItem;
