import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export const EditorSkeleton = ({ className }: { className?: string }) => {
  return <Skeleton className={cn(`h-62.5 w-full rounded-md`, className)} />;
};
