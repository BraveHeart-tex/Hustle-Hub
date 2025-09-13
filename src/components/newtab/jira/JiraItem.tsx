import { AlertCircle, CheckSquare, Clock } from 'lucide-react';

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const JiraItem = ({ ticket }: { ticket: any }) => {
  return (
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
          <span className="text-xs text-muted-foreground">{ticket.status}</span>
        </div>
      </div>

      <h3 className="font-medium text-sm text-foreground mb-2 text-balance">
        {ticket.title}
      </h3>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>@{ticket.assignee}</span>
        <span
          className={
            ticket.dueDate === 'Today' ? 'text-destructive font-medium' : ''
          }
        >
          {ticket.dueDate}
        </span>
      </div>
    </div>
  );
};
export default JiraItem;
