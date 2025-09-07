import { GitBranch, MessageSquare, ThumbsUp } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { GitLabMergeRequest, MergeStatus } from '@/types/gitlab';

interface MRItemProps {
  mr: GitLabMergeRequest;
}

const getStatusBadge = ({
  status,
  draft,
  workInProgress,
}: {
  status: MergeStatus;
  draft?: boolean;
  workInProgress?: boolean;
}) => {
  // Priority badge: draft or WIP
  if (draft) {
    return (
      <Badge variant="secondary" className="text-xs">
        Draft
      </Badge>
    );
  }
  if (workInProgress) {
    return (
      <Badge variant="secondary" className="text-xs">
        WIP
      </Badge>
    );
  }

  switch (status) {
    case 'can_be_merged':
      return (
        <Badge variant="secondary" className="text-xs">
          Ready to Merge
        </Badge>
      );
    case 'cannot_be_merged':
      return (
        <Badge variant="destructive" className="text-xs">
          Cannot Merge
        </Badge>
      );
    case 'unchecked':
      return (
        <Badge variant="outline" className="text-xs">
          Not Checked
        </Badge>
      );
    case 'merged':
      return (
        <Badge variant="outline" className="text-xs">
          Merged
        </Badge>
      );
    case 'needs_review':
      return (
        <Badge variant="destructive" className="text-xs">
          Needs Review
        </Badge>
      );
    case 'approved':
      return (
        <Badge className="text-xs bg-green-500 hover:bg-green-600">
          Approved
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="text-xs">
          {status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
        </Badge>
      );
  }
};

const MRItem = ({ mr }: MRItemProps) => {
  const handleCardClick = () => {
    window.open(mr.web_url, '_blank', 'noopener,noreferrer');
  };
  return (
    <div
      className="p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground">
            !{mr.iid}
          </span>
          {getStatusBadge({
            status: mr.merge_status,
            draft: mr.draft,
            workInProgress: mr.work_in_progress,
          })}
        </div>
        <span className="text-xs text-muted-foreground">
          {formatDate(mr.created_at, {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </span>
      </div>

      <h3 className="font-medium text-sm text-foreground mb-2 text-balance">
        {mr.title}
      </h3>

      <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
        <GitBranch className="h-3 w-3" />
        <span>{mr.source_branch}</span>
        <span>→</span>
        <span>{mr.target_branch}</span>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>by @{mr.author.username}</span>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <ThumbsUp className="h-3 w-3" />
            <span>
              {mr.approvals_before_merge ?? 0}/{mr.approvals_before_merge ?? 0}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <MessageSquare className="h-3 w-3" />
            <span>{mr.user_notes_count}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MRItem;
