import { EyeIcon, UserIcon } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import GitlabIcon from '@/components/misc/GitlabIcon';
import MRItem from '@/components/newtab/gitlab/MRItem';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useGitlabMrs } from '@/hooks/useGitlabMrs';
import { GITLAB_FILTERS, GitlabFilter } from '@/lib/constants';
import { onMessage, sendMessage } from '@/messaging';

export default function GitlabSection() {
  const [filter, setFilter] = useState<GitlabFilter>(GITLAB_FILTERS.REVIEW);
  const { data, isError, isLoading, isUnauthorized, error, refetch } =
    useGitlabMrs(filter);
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

    return data?.data.map((mr) => <MRItem mr={mr} key={mr.iid} />);
  }, [data?.data, error?.message, isError, isLoading, isUnauthorized]);

  const handleTitleClick = () => {
    window.open(
      'https://gitlab.com/dashboard/merge_requests',
      '_blank',
      'noopener,noreferrer',
    );
  };

  const toggleFilterType = () => {
    setFilter((prev) =>
      prev === GITLAB_FILTERS.REVIEW
        ? GITLAB_FILTERS.ASSIGNED
        : GITLAB_FILTERS.REVIEW,
    );
  };

  return (
    <Card className="max-h-[calc(100vh-110px)] flex flex-col">
      <CardHeader className="pb-1 shrink-0">
        <CardTitle className="w-full flex items-center justify-between">
          <div className="flex items-center gap-2 text-lg">
            <GitlabIcon className="h-5 w-5" />
            <span className="cursor-pointer" onClick={handleTitleClick}>
              GitLab MRs
            </span>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={toggleFilterType}
            disabled={isLoading}
          >
            {filter === GITLAB_FILTERS.ASSIGNED ? <UserIcon /> : <EyeIcon />}
          </Button>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 space-y-3 overflow-auto pt-2">
        {renderContent()}
      </CardContent>
    </Card>
  );
}
