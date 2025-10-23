import {
  AlertCircleIcon,
  CheckIcon,
  GitBranch,
  MessageSquare,
  ThumbsUp,
} from 'lucide-react';

import GitlabUserAvatar from '@/components/newtab/gitlab/GitlabUserAvatar';
import MRLabel from '@/components/newtab/gitlab/MRLabel';
import MrStatusBadge from '@/components/newtab/gitlab/MrStatusBadge';
import MRStatusIcon from '@/components/newtab/gitlab/MRStatusIcon';
import { Badge } from '@/components/ui/badge';
import { cn, formatDate } from '@/lib/utils';
import { GitlabMergeRequest } from '@/types/gitlab';

interface MRItemProps {
  mr: GitlabMergeRequest;
}

const MRItem = ({ mr }: MRItemProps) => {
  const handleCardClick = () => {
    window.open(mr.webUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className={cn(
        'p-3 rounded-lg border border-border hover:bg-muted/50 dark:hover:bg-accent/50 transition-colors cursor-pointer relative',
        mr.needsCurrentUserAction &&
          'border-yellow-500 dark:border-yellow-700 border-2',
        (mr.conflicts || mr.headPipelineStatus === 'FAILED') &&
          'border-destructive border-2',
      )}
      onClick={handleCardClick}
    >
      {mr.needsCurrentUserAction && (
        <MRStatusIcon
          title="Action required"
          variant="warning"
          icon={<AlertCircleIcon className="w-4 h-4" />}
        />
      )}
      {mr.conflicts && (
        <MRStatusIcon
          title="This MR has conflicts"
          variant="destructive"
          icon={<AlertCircleIcon />}
        />
      )}

      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground">
            !{mr.iid}
          </span>
          <MrStatusBadge status={mr.mergeStatus} draft={mr.draft} />
          {mr.headPipelineStatus === 'FAILED' && (
            <Badge variant="destructive" className="text-xs">
              Pipeline Failed
            </Badge>
          )}
        </div>
        <span className="text-xs text-muted-foreground">
          {formatDate(mr.createdAt, {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </span>
      </div>

      <h3 className="font-medium text-sm text-foreground mb-2 text-balance">
        {mr.title}
      </h3>
      {mr.labels && mr.labels.length > 0 && (
        <div className="flex items-center gap-2 mb-2">
          {mr.labels.map((label) => (
            <MRLabel key={label.title} label={label} />
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
        <GitBranch className="h-3 w-3" />
        <span>{mr.sourceBranch}</span>
        <span>→</span>
        <span>{mr.targetBranch}</span>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>by @{mr.author.username}</span>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <ThumbsUp className="h-3 w-3" />
            <span>{`${mr.approvedBy}/${mr.approvalsRequired}`}</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageSquare className="h-3 w-3" />
            <span>{mr.userNotesCount}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 mt-2">
        <GitlabUserAvatar src={mr.author.avatarUrl} />

        {mr.reviewers && mr.reviewers.length > 0 && (
          <div className="flex items-center gap-2">
            {mr.reviewers.map((reviewer) => (
              <div key={reviewer.id} className="relative inline-block">
                <GitlabUserAvatar src={reviewer.avatarUrl} />

                {reviewer.hasApproved && (
                  <CheckIcon className="absolute -bottom-1 -right-1 w-4 h-4 text-white bg-green-500 dark:bg-green-700 rounded-full p-[1px] border border-gray-200" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MRItem;
