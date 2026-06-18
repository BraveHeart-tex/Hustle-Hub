import { AlertCircle, CheckSquare } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { JiraIcon } from '@/components/misc/JiraIcon';
import { FilterButton } from '@/components/newtab/FilterButton';
import { JiraItem } from '@/components/newtab/jira/JiraItem';
import { KeyboardShortcutKey } from '@/components/newtab/KeyboardShortcutKey';
import { useTwoKeyFilterShortcuts } from '@/components/newtab/useTwoKeyFilterShortcuts';
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

const filterOptions = [
  {
    label: 'For You',
    shortcutKeys: ['j', 'f'],
    key: 'f',
    value: JIRA_FILTERS.FOR_YOU,
  },
  {
    label: 'Literally Working On',
    shortcutKeys: ['j', 'l'],
    key: 'l',
    value: JIRA_FILTERS.LITERALLY_WORKING_ON,
  },
  {
    label: 'Frontend Releases',
    shortcutKeys: ['j', 'r'],
    key: 'r',
    value: JIRA_FILTERS.FRONTEND_RELEASES,
  },
];

interface JiraSectionProps {
  className?: string;
}

export function JiraSection({ className }: JiraSectionProps) {
  const [filter, setFilter] = useJiraFilter();
  const { data, isLoading, isError, error } = useJiraTickets(filter);
  const [selectedTaskStatus, setSelectedTaskStatus] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

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
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-4 animate-pulse">
              <CardContent>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (isError) {
      return (
        <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
          <AlertCircle size={22} className="text-destructive/50" />
          <p className="text-sm text-destructive font-medium">
            {error?.message ?? 'Failed to load tickets.'}
          </p>
        </div>
      );
    }

    if (filteredData?.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
          <CheckSquare size={22} className="text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No tickets found.</p>
        </div>
      );
    }

    return filteredData?.map((issue) => (
      <JiraItem key={issue.id} issue={issue} />
    ));
  }, [filteredData, error?.message, isError, isLoading]);

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
    options: filterOptions,
    prefixKey: 'j',
    onCancel: closeShortcutFilter,
    onPrefix: openShortcutFilter,
    onSelect: handleShortcutFilterSelect,
  });

  return (
    <Card className={cn('flex flex-col overflow-hidden', className)}>
      <CardHeader className="pb-3 shrink-0">
        <CardTitle className="w-full flex items-center justify-between">
          <div className="flex items-center gap-2 text-lg">
            <a href={getJiraForYouUrl()} target="_blank" rel="noreferrer">
              <JiraIcon className="text-blue-500" />
            </a>
            Jira Tickets
          </div>
          <Select
            open={isFilterOpen}
            onOpenChange={setIsFilterOpen}
            value={filter}
            onValueChange={handleFilterValueChange}
            defaultValue={filter}
            disabled={isLoading}
          >
            <SelectTrigger size="sm">
              <SelectValue />
              <KeyboardShortcutKey>j</KeyboardShortcutKey>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {filterOptions.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
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
