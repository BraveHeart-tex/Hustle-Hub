'use client';

import { useIsFetching, useIsMutating } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';

const GlobalStatusIndicator = () => {
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();
  const isActive = isFetching > 0 || isMutating > 0;

  return (
    <div
      className={cn(
        'fixed bottom-4 left-4 flex items-center gap-2 rounded-2xl shadow-lg px-3 py-2 transition-all',
        isActive
          ? 'bg-chart-1 text-white opacity-100'
          : 'bg-muted text-muted-foreground',
      )}
    >
      {isActive ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <div className="h-2 w-2 rounded-full bg-muted-foreground" />
      )}
      <span className="text-sm font-medium">
        {isFetching > 0
          ? `Fetching (${isFetching})`
          : isMutating > 0
            ? `Mutating (${isMutating})`
            : 'Idle'}
      </span>
    </div>
  );
};

export default GlobalStatusIndicator;
