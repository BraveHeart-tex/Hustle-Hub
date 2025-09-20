import { GitBranch, MessageSquare, ThumbsUp } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { formatDate, formatGitLabLabel, getForegroundColor } from '@/lib/utils';
import { GitlabMergeRequest, MergeStatus } from '@/types/gitlab';

interface MRItemProps {
  mr: GitlabMergeRequest;
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

  switch (status.toLowerCase()) {
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
    window.open(mr.webUrl, '_blank', 'noopener,noreferrer');
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
            status: mr.mergeStatus,
            draft: mr.draft,
          })}
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
            <Badge
              key={label.title}
              variant="outline"
              className="text-xs text-muted-foreground"
              style={{
                backgroundColor: label.color,
                color: getForegroundColor(label.color),
              }}
            >
              {formatGitLabLabel(label.title)}
            </Badge>
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
    </div>
  );
};

export default MRItem;
