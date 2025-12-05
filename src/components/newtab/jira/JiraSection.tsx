import { useCallback, useState } from 'react';

import JiraIcon from '@/components/misc/JiraIcon';
import FilterButton from '@/components/newtab/FilterButton';
import JiraItem from '@/components/newtab/jira/JiraItem';
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
import { JIRA_FILTERS, JiraFilter } from '@/lib/constants';
import { isValueOf } from '@/lib/utils/misc/isValueOf';

const filterOptions = [
  {
    label: 'For You',
    value: JIRA_FILTERS.FOR_YOU,
  },
  {
    label: 'Literally Working On',
    value: JIRA_FILTERS.LITERALLY_WORKING_ON,
  },
  {
    label: 'Frontend Releases',
    value: JIRA_FILTERS.FRONTEND_RELEASES,
  },
];

export default function JiraSection() {
  const [filter, setFilter] = useState<JiraFilter>(
    JIRA_FILTERS.LITERALLY_WORKING_ON,
  );
  const { data, isLoading, isError, error } = useJiraTickets(filter);
  const [selectedTaskStatus, setSelectedTaskStatus] = useState('');

  const taskStatuses = useMemo(() => {
    if (!data?.issues) return [];

    const counts: Record<string, number> = {};
    const result: string[] = [];

    for (const issue of data.issues) {
      const status = issue.fields.status.name;

      const next = (counts[status] ?? 0) + 1;
      counts[status] = next;

      if (next === 2) {
        result.push(status);
      }
    }

    return result;
  }, [data?.issues]);

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
      return <p className="text-destructive font-medium">{error?.message}</p>;
    }

    if (data?.issues.length === 0) {
      return <p className="text-muted-foreground">No issues found.</p>;
    }

    return data?.issues
      .filter((issue) =>
        selectedTaskStatus
          ? issue.fields.status.name === selectedTaskStatus
          : true,
      )
      .map((issue) => <JiraItem key={issue.id} issue={issue} />);
  }, [data?.issues, error?.message, isError, isLoading, selectedTaskStatus]);

  const handleFilterValueChange = (filterValue: string) => {
    if (isValueOf(JIRA_FILTERS, filterValue)) {
      setFilter(filterValue);
      setSelectedTaskStatus('');
    }
  };

  return (
    <Card className="max-h-[calc(100vh-110px)] flex flex-col">
      <CardHeader className="pb-3 shrink-0">
        <CardTitle className="w-full flex items-center justify-between">
          <div className="flex items-center gap-2 text-lg">
            <a
              href="https://letgotr.atlassian.net/jira/for-you"
              target="_blank"
              rel="noreferrer"
            >
              <JiraIcon className="text-blue-500" />
            </a>
            Jira Tickets
          </div>
          <Select
            value={filter}
            onValueChange={handleFilterValueChange}
            defaultValue={filter}
            disabled={isLoading}
          >
            <SelectTrigger size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {filterOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </CardTitle>
        {isLoading && <Skeleton className="h-4 w-1/3" />}
        {!isLoading && taskStatuses.length > 1 && (
          <div className="flex items-center gap-2 flex-nowrap whitespace-nowrap  overflow-x-auto">
            {taskStatuses.map((status) => (
              <FilterButton
                key={status}
                active={status === selectedTaskStatus}
                onClick={() =>
                  setSelectedTaskStatus((prev) =>
                    prev === status ? '' : status,
                  )
                }
              >
                {status}
              </FilterButton>
            ))}
          </div>
        )}
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto space-y-3">
        {renderContent()}
      </CardContent>
    </Card>
  );
}
