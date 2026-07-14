import { cn } from '@/lib/utils';
import { type MergeStatus } from '@/types/gitlab';

type StatusTone = 'neutral' | 'warning' | 'success' | 'critical';

const DOT_CLASS: Record<StatusTone, string> = {
  neutral: 'bg-muted-foreground/50',
  warning: 'bg-warning',
  success: 'bg-success',
  critical: 'bg-destructive',
};

const getStatus = ({
  status,
  draft,
  workInProgress,
}: {
  status: MergeStatus;
  draft?: boolean;
  workInProgress?: boolean;
}): { label: string; tone: StatusTone } => {
  if (draft) {
    return { label: 'Draft', tone: 'neutral' };
  }
  if (workInProgress) {
    return { label: 'WIP', tone: 'neutral' };
  }

  switch (status.toLowerCase()) {
    case 'can_be_merged':
      return { label: 'Ready to Merge', tone: 'neutral' };
    case 'cannot_be_merged':
      return { label: 'Cannot Merge', tone: 'critical' };
    case 'unchecked':
      return { label: 'Not Checked', tone: 'neutral' };
    case 'merged':
      return { label: 'Merged', tone: 'neutral' };
    case 'needs_review':
      return { label: 'Needs Review', tone: 'warning' };
    case 'approved':
      return { label: 'Approved', tone: 'success' };
    default:
      return {
        label: status
          .replace(/_/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase()),
        tone: 'neutral',
      };
  }
};

interface MRStatusBadgeProps {
  status: string;
  draft?: boolean;
}

export const MrStatusBadge = ({ status, draft }: MRStatusBadgeProps) => {
  const { label, tone } = getStatus({ status, draft });

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
      <span
        aria-hidden="true"
        className={cn('size-1.5 shrink-0 rounded-full', DOT_CLASS[tone])}
      />
      {label}
    </span>
  );
};
