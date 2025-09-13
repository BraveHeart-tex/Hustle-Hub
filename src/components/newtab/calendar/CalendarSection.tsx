import { Calendar } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';

import CalendarItem from '@/components/newtab/calendar/CalendarItem';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import { onMessage, sendMessage } from '@/messaging';

const CalendarSection = () => {
  const { data, isError, isLoading, isUnauthorized, refetch, error } =
    useCalendarEvents();

  const handleAuthorize = () => {
    sendMessage('authorizeGoogleCalendar');
  };

  useEffect(() => {
    const unsubscribe = onMessage('googleCalendarOAuthCallback', (message) => {
      if (message.data.status === 'error') {
        toast.error('Google Calendar authorization failed.');
        return;
      }

      toast.success('Google Calendar authorization is successful.');
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
            Authorize Google Calendar
          </Button>
        </div>
      );
    }

    if (isError) {
      return <p className="text-destructive font-medium">{error?.message}</p>;
    }

    if (data?.items.length === 0) {
      return <p className="text-muted-foreground">No events found.</p>;
    }

    return data?.items.map((event) => (
      <CalendarItem event={event} key={event.id} />
    ));
  }, [data?.items, error?.message, isError, isLoading, isUnauthorized]);

  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calendar className="h-5 w-5 text-primary" />
          Today&apos;s Meetings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">{renderContent()}</CardContent>
    </Card>
  );
};

export default CalendarSection;
