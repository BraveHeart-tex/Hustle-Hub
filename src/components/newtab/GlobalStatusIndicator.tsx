import {
  useIsFetching,
  useIsMutating,
  useQueryClient,
} from '@tanstack/react-query';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/utils';

const SUCCESS_DISPLAY_DURATION = 2_500;

export const GlobalStatusIndicator = () => {
  const queryClient = useQueryClient();
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();
  const wasActiveRef = useRef(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const activeQueries = queryClient.getQueryCache().findAll({ type: 'active' });
  const failedQueries = activeQueries.filter(
    (query) => query.state.status === 'error',
  ).length;
  const successfulQueries = activeQueries.filter(
    (query) => query.state.status === 'success',
  ).length;
  const initialLoads = activeQueries.filter(
    (query) =>
      query.state.fetchStatus === 'fetching' && query.state.data === undefined,
  ).length;
  const isActive = isFetching > 0 || isMutating > 0;

  useEffect(() => {
    if (isActive) {
      wasActiveRef.current = true;
      setShowSuccess(false);
      return;
    }

    if (!wasActiveRef.current || failedQueries > 0) return;

    wasActiveRef.current = false;
    setShowSuccess(true);
    const timer = window.setTimeout(
      () => setShowSuccess(false),
      SUCCESS_DISPLAY_DURATION,
    );

    return () => window.clearTimeout(timer);
  }, [failedQueries, isActive]);

  let label = '';
  let state: 'loading' | 'success' | 'partial' | 'failure' | 'idle' = 'idle';

  if (isActive) {
    state = 'loading';
    if (initialLoads > 0) {
      label = `Loading data (${initialLoads})`;
    } else if (isFetching > 0 && failedQueries > 0) {
      label = `Refreshing data with ${failedQueries} failed source${failedQueries === 1 ? '' : 's'}`;
    } else if (isFetching > 0) {
      label = `Refreshing data (${isFetching})`;
    } else {
      label = `Saving changes (${isMutating})`;
    }
  } else if (failedQueries > 0 && successfulQueries > 0) {
    state = 'partial';
    label = `${failedQueries} data source${failedQueries === 1 ? '' : 's'} failed to update`;
  } else if (failedQueries > 0) {
    state = 'failure';
    label = 'Data could not be loaded';
  } else if (showSuccess) {
    state = 'success';
    label = 'Data updated';
  }

  if (state === 'idle') return null;

  const Icon =
    state === 'loading'
      ? Loader2
      : state === 'success'
        ? CheckCircle2
        : AlertCircle;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'fixed bottom-4 left-4 flex items-center gap-2 rounded-lg px-3 py-2 shadow-md',
        'motion-safe:transition-opacity motion-safe:duration-150 motion-reduce:transition-none',
        state === 'failure' || state === 'partial'
          ? 'bg-destructive text-destructive-foreground'
          : 'bg-primary text-primary-foreground',
      )}
    >
      <Icon
        aria-hidden="true"
        className={cn(
          'h-4 w-4',
          state === 'loading' && 'motion-safe:animate-spin',
        )}
      />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
};
