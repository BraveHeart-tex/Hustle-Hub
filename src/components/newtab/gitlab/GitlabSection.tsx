import { useCallback, useEffect } from 'react';
import { toast } from 'sonner';

import GitlabIcon from '@/components/misc/GitlabIcon';
import MRItem from '@/components/newtab/gitlab/MRItem';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useGitlabMrs } from '@/hooks/useGitlabMrs';
import { onMessage, sendMessage } from '@/messaging';

export default function GitlabSection() {
  const {
    assigned,
    isError,
    isLoading,
    isUnauthorized,
    review,
    errorMessage,
    refetch,
  } = useGitlabMrs();
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
      return <p className="text-destructive font-medium">{errorMessage}</p>;
    }

    if (assigned.length === 0 && review.length === 0) {
      return <p className="text-muted-foreground">No MRs found.</p>;
    }

    return (
      <>
        {assigned.map((mr) => (
          <MRItem mr={mr} key={`assigned-${mr.id}`} />
        ))}
        {review.map((mr) => (
          <MRItem mr={mr} key={`review-${mr.id}`} />
        ))}
      </>
    );
  }, [assigned, errorMessage, isError, isLoading, isUnauthorized, review]);

  return (
    <Card className="max-h-[calc(100vh-110px)] flex flex-col">
      <CardHeader className="pb-3 shrink-0">
        <CardTitle className="flex items-center gap-2 text-lg">
          <GitlabIcon className="h-5 w-5" />
          GitLab MRs
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto space-y-3">
        {renderContent()}
      </CardContent>
    </Card>
  );
}
