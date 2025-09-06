import { AlertCircle, CheckSquare, Clock } from 'lucide-react';

import JiraIcon from '@/components/misc/JiraIcon';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const mockTickets = [
  {
    id: 'DEV-123',
    title: 'Implement user authentication',
    status: 'In Progress',
    priority: 'High',
    assignee: 'You',
    dueDate: 'Today',
    statusColor: 'bg-amber-500',
  },
  {
    id: 'DEV-124',
    title: 'Fix responsive layout issues',
    status: 'To Do',
    priority: 'Medium',
    assignee: 'You',
    dueDate: 'Tomorrow',
    statusColor: 'bg-gray-400',
  },
  {
    id: 'DEV-125',
    title: 'Update API documentation',
    status: 'In Review',
    priority: 'Low',
    assignee: 'Sarah Chen',
    dueDate: 'Dec 15',
    statusColor: 'bg-blue-500',
  },
  {
    id: 'DEV-126',
    title: 'Database migration script',
    status: 'Done',
    priority: 'High',
    assignee: 'You',
    dueDate: 'Completed',
    statusColor: 'bg-green-500',
  },
];

const getPriorityIcon = (priority: string) => {
  switch (priority) {
    case 'High':
      return <AlertCircle className="h-3 w-3 text-destructive" />;
    case 'Medium':
      return <Clock className="h-3 w-3 text-amber-500" />;
    default:
      return <CheckSquare className="h-3 w-3 text-muted-foreground" />;
  }
};

export default function JiraSection() {
  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <JiraIcon className="h-5 w-5 text-blue-500" />
          Jira Tickets
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {mockTickets.map((ticket) => (
          <div
            key={ticket.id}
            className="p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-muted-foreground">
                  {ticket.id}
                </span>
                {getPriorityIcon(ticket.priority)}
              </div>
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${ticket.statusColor}`} />
                <span className="text-xs text-muted-foreground">
                  {ticket.status}
                </span>
              </div>
            </div>

            <h3 className="font-medium text-sm text-foreground mb-2 text-balance">
              {ticket.title}
            </h3>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>@{ticket.assignee}</span>
              <span
                className={
                  ticket.dueDate === 'Today'
                    ? 'text-destructive font-medium'
                    : ''
                }
              >
                {ticket.dueDate}
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
