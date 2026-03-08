import { useIsFetching, useIsMutating } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';

const GlobalStatusIndicator = () => {
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();
  const isActive = isFetching > 0 || isMutating > 0;

  const label =
    isFetching > 0
      ? `Fetching (${isFetching})`
      : isMutating > 0
        ? `Mutating (${isMutating})`
        : 'Idle';

  return (
    <div
      className={cn(
        'fixed bottom-4 left-4 flex items-center gap-2 rounded-2xl shadow-lg px-3 py-2',
        'transition-all duration-300',
        isActive
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-2 pointer-events-none',
        'bg-primary text-primary-foreground',
      )}
    >
      <Loader2 className="h-4 w-4 animate-spin" />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
};

export default GlobalStatusIndicator;
