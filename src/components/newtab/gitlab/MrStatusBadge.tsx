import { Badge } from '@/components/ui/badge';
import { MergeStatus } from '@/types/gitlab';

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

interface MRStatusBadgeProps {
  status: string;
  draft?: boolean;
}

const MrStatusBadge = ({ status, draft }: MRStatusBadgeProps) => {
  return getStatusBadge({ status, draft });
};

export default MrStatusBadge;
