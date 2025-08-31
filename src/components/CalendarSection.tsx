import { Calendar, Clock, Users } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const mockMeetings = [
  {
    id: 1,
    title: 'Daily Standup',
    time: '9:00 AM',
    duration: '30 min',
    attendees: 5,
    type: 'recurring',
  },
  {
    id: 2,
    title: 'Sprint Planning',
    time: '2:00 PM',
    duration: '2 hours',
    attendees: 8,
    type: 'important',
  },
  {
    id: 3,
    title: 'Code Review Session',
    time: '4:30 PM',
    duration: '1 hour',
    attendees: 3,
    type: 'normal',
  },
  {
    id: 4,
    title: '1:1 with Manager',
    time: '5:30 PM',
    duration: '30 min',
    attendees: 2,
    type: 'important',
  },
];

export default function CalendarSection() {
  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calendar className="h-5 w-5 text-primary" />
          Today&apos;s Meetings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {mockMeetings.map((meeting) => (
          <div
            key={meeting.id}
            className="flex items-start justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium text-sm text-foreground truncate">
                  {meeting.title}
                </h3>
                {meeting.type === 'important' && (
                  <Badge
                    variant="destructive"
                    className="text-xs px-1.5 py-0.5"
                  >
                    Important
                  </Badge>
                )}
                {meeting.type === 'recurring' && (
                  <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                    Recurring
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {meeting.time}
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {meeting.attendees}
                </div>
              </div>
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
              {meeting.duration}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
