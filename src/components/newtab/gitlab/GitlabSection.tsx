import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import GitlabIcon from '@/components/misc/GitlabIcon';
import MRItem from '@/components/newtab/gitlab/MRItem';
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
import { useGitlabMrs } from '@/hooks/useGitlabMrs';
import { GITLAB_FILTERS, GitlabFilter } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { isValueOf } from '@/lib/utils/misc/isValueOf';
import { onMessage, sendMessage } from '@/messaging';

const filterOptions = [
  { label: 'Review Requested', value: GITLAB_FILTERS.REVIEW },
  { label: 'Assigned to me', value: GITLAB_FILTERS.ASSIGNED },
];

export default function GitlabSection() {
  const [filter, setFilter] = useState<GitlabFilter>(GITLAB_FILTERS.REVIEW);
  const { data, isError, isLoading, isUnauthorized, error, refetch } =
    useGitlabMrs(filter);
  const [selectedProjectName, setSelectedProjectName] = useState('');
  const handleAuthorize = () => {
    sendMessage('authorizeGitlab');
  };

  useEffect(() => {
    const unsubscribe = onMessage('gitlabOAuthCallback', (message) => {
      if (message.data.status === 'error') {
        toast.error('Gitlab authorization failed.');
        return;
      }

      toast.success('Gitlab authorization is successful.');
      refetch();
    });

    return () => {
      unsubscribe();
    };
  }, [refetch]);

  const handleFilterValueChange = (value: string) => {
    if (isValueOf(GITLAB_FILTERS, value)) {
      setSelectedProjectName('');
      setFilter(value);
    }
  };

  const avilableProjectNames: string[] = useMemo(() => {
    if (!data) return [];
    return data.data.reduce<string[]>((acc, curr) => {
      const projectName = curr.projectName;
      if (projectName && !acc.includes(projectName)) {
        acc.push(projectName);
      }
      return acc;
    }, []);
  }, [data]);

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

    if (isUnauthorized) {
      return (
        <div className="flex justify-center">
          <Button onClick={handleAuthorize} variant="default">
            Authorize GitLab
          </Button>
        </div>
      );
    }

    if (isError) {
      return <p className="text-destructive font-medium">{error?.message}</p>;
    }

    if (data?.data.length === 0) {
      return <p className="text-muted-foreground">No MRs found.</p>;
    }

    return data?.data
      .filter((mr) =>
        selectedProjectName ? mr.projectName === selectedProjectName : true,
      )
      .map((mr) => <MRItem mr={mr} key={mr.iid} />);
  }, [
    data?.data,
    error?.message,
    isError,
    isLoading,
    isUnauthorized,
    selectedProjectName,
  ]);

  const projectNameCounts = useMemo(() => {
    if (!data?.data) return {};

    return data?.data.reduce<Record<string, number>>((acc, curr) => {
      const projectName = curr.projectName;
      acc[projectName] = (acc[projectName] || 0) + 1;
      return acc;
    }, {});
  }, [data?.data]);

  return (
    <Card className="max-h-[calc(100vh-110px)] flex flex-col">
      <CardHeader className="pb-1 shrink-0">
        <CardTitle className="w-full flex items-center justify-between">
          <div className="flex items-center gap-2 text-lg">
            <a
              href="https://gitlab.com/dashboard/merge_requests"
              target="_blank"
              rel="noreferrer noopener"
            >
              <GitlabIcon />
            </a>
            <span>GitLab MRs</span>
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
                    {option.label}{' '}
                    {projectNameCounts[option.value] &&
                      `(${projectNameCounts[option.value]})`}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </CardTitle>
        {isLoading && <Skeleton className="h-4 w-1/3" />}
        {!isLoading && avilableProjectNames.length > 1 && (
          <div className="flex items-center gap-2 flex-nowrap whitespace-nowrap">
            {avilableProjectNames.map((projectName) => (
              <Button
                key={projectName}
                size={'sm'}
                variant={
                  selectedProjectName === projectName ? 'default' : 'outline'
                }
                className={cn(
                  selectedProjectName === projectName &&
                    'border dark:border-input',
                )}
                onClick={() =>
                  setSelectedProjectName((prev) =>
                    prev === projectName ? '' : projectName,
                  )
                }
              >
                {projectName}
              </Button>
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 space-y-3 overflow-auto pt-2">
        {renderContent()}
      </CardContent>
    </Card>
  );
}
