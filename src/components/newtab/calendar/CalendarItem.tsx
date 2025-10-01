import {
  CheckCircle,
  Clock,
  HelpCircle,
  LucideIcon,
  Users,
  XCircle,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils.ts';
import { GoogleCalendarAttendee, GoogleCalendarEvent } from '@/types/google';

interface CalendarItemProps {
  event: GoogleCalendarEvent;
}

interface StatusDisplayData {
  icon: LucideIcon;
  label: string;
  iconClass: string;
  textClass: string;
}

function getStatusDisplayData(
  status: GoogleCalendarAttendee['responseStatus'],
): StatusDisplayData {
  const map: Record<
    GoogleCalendarAttendee['responseStatus'],
    StatusDisplayData
  > = {
    needsAction: {
      icon: Clock,
      label: 'Needs Action',
      iconClass: 'text-yellow-500',
      textClass: 'text-yellow-700',
    },
    declined: {
      icon: XCircle,
      label: 'Declined',
      iconClass: 'text-red-500',
      textClass: 'text-red-700',
    },
    tentative: {
      icon: HelpCircle,
      label: 'Tentative',
      iconClass: 'text-blue-500',
      textClass: 'text-blue-700',
    },
    accepted: {
      icon: CheckCircle,
      label: 'Accepted',
      iconClass: 'text-green-500',
      textClass: 'text-green-700',
    },
  };

  return map[status];
}

const CalendarItem = ({ event }: CalendarItemProps) => {
  const title = event.summary || 'Untitled Event';
  const isRecurring = Boolean(event.recurringEventId);
  const isOutOfOffice = event.eventType === 'outOfOffice';

  const start = (event.start.dateTime || event.start.date) as string;
  const end = (event.end.dateTime || event.end.date) as string;

  const timeFormatter = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const formattedTime = event.start.dateTime
    ? `${timeFormatter.format(new Date(start))} – ${timeFormatter.format(
        new Date(end),
      )}`
    : 'All day';

  const duration =
    event.start.dateTime && event.end.dateTime
      ? `${Math.round(
          (new Date(end).getTime() - new Date(start).getTime()) / 60000,
        )} min`
      : '';

  const attendeesCount = event.attendees?.length ?? 0;

  const now = new Date().getTime();
  const startTime = new Date(start).getTime();
  const endTime = new Date(end).getTime();
  const hasJoinLink = Boolean(
    event.hangoutLink || event.conferenceData?.entryPoints?.[0]?.uri,
  );

  const shouldShowJoin =
    hasJoinLink &&
    event.start.dateTime &&
    startTime - now <= 10 * 60 * 1000 &&
    now < endTime;

  const handleJoin = (mouseEvent: React.MouseEvent) => {
    mouseEvent.stopPropagation();

    const joinUrl =
      event.hangoutLink || event.conferenceData?.entryPoints?.[0]?.uri;

    if (joinUrl) window.open(joinUrl, '_blank');
  };

  const {
    icon: StatusIcon,
    label,
    iconClass,
    textClass,
  } = getStatusDisplayData(event?.currentUserResponse || 'needsAction');

  return (
    <div className="flex flex-col p-3 rounded-lg border border-border hover:bg-muted/50 dark:hover:bg-accent/50 transition-colors cursor-pointer">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-medium text-sm text-foreground truncate">
            {title}
          </h3>
          {isOutOfOffice && (
            <Badge variant="destructive" className="text-xs px-1.5 py-0.5">
              Out of Office
            </Badge>
          )}
          {isRecurring && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
              Recurring
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formattedTime}
          </div>
          {attendeesCount > 0 && (
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {attendeesCount}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 mt-2">
        {duration && (
          <span className="text-xs text-muted-foreground">{duration}</span>
        )}
        {shouldShowJoin && (
          <Button size="sm" className="text-xs" onClick={handleJoin}>
            Join
          </Button>
        )}
      </div>
      <div className="flex items-center gap-1 mt-2">
        <StatusIcon className={cn('size-4', iconClass)} />
        <span className={cn('text-xs font-medium', textClass)}>{label}</span>
      </div>
    </div>
  );
};

export default CalendarItem;
