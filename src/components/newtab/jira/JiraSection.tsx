import { AlertCircle, CheckSquare, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { JiraIcon } from '@/components/misc/JiraIcon';
import { FilterButton } from '@/components/newtab/FilterButton';
import { JiraItem } from '@/components/newtab/jira/JiraItem';
import { KeyboardShortcutKey } from '@/components/newtab/KeyboardShortcutKey';
import { JIRA_FILTER_SHORTCUTS } from '@/components/newtab/keyboardShortcuts';
import { useTwoKeyFilterShortcuts } from '@/components/newtab/useTwoKeyFilterShortcuts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useJiraTickets } from '@/hooks/useJiraTickets';
import { JIRA_FILTERS } from '@/lib/constants';
import { useJiraFilter } from '@/lib/storage/filters';
import { cn } from '@/lib/utils';
import { getJiraForYouUrl } from '@/lib/utils/misc/getJiraTaskUrl';
import { isValueOf } from '@/lib/utils/misc/isValueOf';

interface JiraSectionProps {
  className?: string;
}

export function JiraSection({ className }: JiraSectionProps) {
  const [filter, setFilter] = useJiraFilter();
  const {
    data,
    isLoading,
    isFetching,
    isError,
    isUnauthorized,
    error,
    refetch,
  } = useJiraTickets(filter);
  const [selectedTaskStatus, setSelectedTaskStatus] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const headingRef = useRef<HTMLSpanElement>(null);
  const hasData = data !== undefined;
  const hasProviderError = isError || isUnauthorized;
  const isRefreshing = isFetching && hasData;

  const retryJira = useCallback(async () => {
    await refetch();
    headingRef.current?.focus();
  }, [refetch]);

  const taskStatuses: { label: string; count: number }[] = useMemo(() => {
    if (!data?.issues) return [];
    const counts: Record<string, number> = {};
    for (const issue of data.issues) {
      const status = issue.fields.status.name;
      counts[status] = (counts[status] ?? 0) + 1;
    }
    return Object.entries(counts).map(([label, count]) => ({ label, count }));
  }, [data?.issues]);

  const filteredData = useMemo(() => {
    return data?.issues.filter((issue) =>
      selectedTaskStatus
        ? issue.fields.status.name === selectedTaskStatus
        : true,
    );
  }, [data?.issues, selectedTaskStatus]);

  useEffect(() => {
    if (selectedTaskStatus && filteredData?.length === 0) {
      setSelectedTaskStatus('');
    }
  }, [filteredData?.length, selectedTaskStatus]);

  const shouldShowStatusFilters =
    !isLoading &&
    taskStatuses.length > 1 &&
    taskStatuses.some((s) => s.count > 1);

  const renderContent = useCallback(() => {
    if (isLoading) {
      return (
        <div className="grid gap-3" aria-hidden="true">
          {[
            'jira-loading-primary',
            'jira-loading-secondary',
            'jira-loading-tertiary',
          ].map((rowId) => (
            <div
              key={rowId}
              className="rounded-lg border border-border px-3 py-2"
            >
              <div className="mb-2 flex items-center justify-between gap-3">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="mt-2 h-3 w-16" />
            </div>
          ))}
        </div>
      );
    }

    if (hasProviderError && !hasData) {
      return (
        <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
          <AlertCircle size={22} className="text-destructive/50" />
          <p className="text-sm text-destructive font-medium">
            {error?.message ?? 'Failed to load tickets.'}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            loading={isFetching}
            onClick={() => void retryJira()}
          >
            <RefreshCw aria-hidden="true" />
            Retry Jira
          </Button>
        </div>
      );
    }

    if (filteredData?.length === 0) {
      return (
        <div className="flex items-center gap-2 py-2">
          <CheckSquare
            aria-hidden="true"
            size={16}
            className="shrink-0 text-muted-foreground/40"
          />
          <p className="text-xs text-muted-foreground">No tickets found.</p>
        </div>
      );
    }

    return filteredData?.map((issue) => (
      <JiraItem key={issue.id} issue={issue} />
    ));
  }, [
    filteredData,
    error?.message,
    hasData,
    hasProviderError,
    isFetching,
    isLoading,
    retryJira,
  ]);

  const handleFilterValueChange = useCallback(
    (filterValue: string) => {
      if (isValueOf(JIRA_FILTERS, filterValue)) {
        setFilter(filterValue);
        setSelectedTaskStatus('');
      }
    },
    [setFilter],
  );

  const closeShortcutFilter = useCallback(() => {
    setIsFilterOpen(false);
  }, []);

  const openShortcutFilter = useCallback(() => {
    setIsFilterOpen(true);
  }, []);

  const handleShortcutFilterSelect = useCallback(
    (filterValue: string) => {
      handleFilterValueChange(filterValue);
      setIsFilterOpen(false);
    },
    [handleFilterValueChange],
  );

  useTwoKeyFilterShortcuts({
    disabled: isLoading,
    isOpen: isFilterOpen,
    options: JIRA_FILTER_SHORTCUTS,
    prefixKey: 'j',
    onCancel: closeShortcutFilter,
    onPrefix: openShortcutFilter,
    onSelect: handleShortcutFilterSelect,
  });

  const hasUrgentIssue = Boolean(
    filteredData?.some(
      (issue) =>
        issue.fields.priority.name === 'Highest' &&
        issue.fields.status.statusCategory.key !== 'done',
    ),
  );
  const sectionState = isLoading
    ? 'loading'
    : filteredData?.length === 0
      ? 'empty'
      : hasUrgentIssue
        ? 'urgent'
        : 'populated';

  return (
    <Card
      data-section-state={sectionState}
      className={cn('flex flex-col overflow-hidden', className)}
    >
      <CardHeader className="pb-3 shrink-0">
        <CardTitle className="w-full flex items-center justify-between">
          <div className="flex items-center gap-2 text-lg">
            <a href={getJiraForYouUrl()} target="_blank" rel="noreferrer">
              <JiraIcon className="text-blue-500" />
            </a>
            <span ref={headingRef} tabIndex={-1} className="outline-none">
              Jira Tickets
            </span>
          </div>
          <Select
            open={isFilterOpen}
            onOpenChange={setIsFilterOpen}
            value={filter}
            onValueChange={handleFilterValueChange}
            defaultValue={filter}
            disabled={isLoading}
          >
            <SelectTrigger
              size="sm"
              aria-label="Filter Jira tickets"
              aria-keyshortcuts="J"
            >
              <SelectValue />
              <KeyboardShortcutKey>j</KeyboardShortcutKey>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {JIRA_FILTER_SHORTCUTS.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    aria-keyshortcuts={option.key.toUpperCase()}
                    shortcut={option.shortcutKeys.map((key) => (
                      <KeyboardShortcutKey key={key}>{key}</KeyboardShortcutKey>
                    ))}
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </CardTitle>
        {isLoading && <Skeleton className="h-4 w-1/3" />}
        <div className="min-h-4">
          {isRefreshing && (
            <p className="text-xs text-muted-foreground" role="status">
              Refreshing Jira tickets…
            </p>
          )}
        </div>
        {hasProviderError && hasData && (
          <div className="flex items-center justify-between gap-2 text-xs text-destructive">
            <span>Could not refresh Jira. Showing previously loaded data.</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 shrink-0"
              loading={isFetching}
              onClick={() => void retryJira()}
            >
              <RefreshCw aria-hidden="true" />
              Retry
            </Button>
          </div>
        )}
        {shouldShowStatusFilters && (
          <div className="flex items-center gap-2 flex-nowrap whitespace-nowrap overflow-x-auto">
            {taskStatuses.map((status) => (
              <FilterButton
                key={status.label}
                active={status.label === selectedTaskStatus}
                onClick={() =>
                  setSelectedTaskStatus((prev) =>
                    prev === status.label ? '' : status.label,
                  )
                }
              >
                {status.label} {status.count > 1 && `(${status.count})`}
              </FilterButton>
            ))}
          </div>
        )}
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto space-y-3 min-h-0">
        {renderContent()}
      </CardContent>
    </Card>
  );
}
