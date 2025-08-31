import { CheckCircle2, Circle, Plus, StickyNote } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const mockNotes = [
  {
    id: 1,
    title: 'Review API documentation',
    content:
      'Go through the new authentication endpoints and update the integration guide',
    completed: false,
    priority: 'high',
    createdAt: '2024-01-15T09:00:00Z',
  },
  {
    id: 2,
    title: 'Team standup notes',
    content:
      'Discussed sprint goals, blocked on database migration. Follow up with DevOps team.',
    completed: true,
    priority: 'medium',
    createdAt: '2024-01-15T10:30:00Z',
  },
  {
    id: 3,
    title: 'Code review feedback',
    content:
      'Address comments on PR #234 - refactor error handling and add unit tests',
    completed: false,
    priority: 'high',
    createdAt: '2024-01-15T14:20:00Z',
  },
  {
    id: 4,
    title: 'Research new framework',
    content:
      'Evaluate Next.js 15 features for potential migration. Check app router compatibility.',
    completed: false,
    priority: 'low',
    createdAt: '2024-01-14T16:45:00Z',
  },
  {
    id: 5,
    title: 'Update dependencies',
    content:
      'Security audit flagged outdated packages. Priority: lodash, axios, react-router',
    completed: true,
    priority: 'medium',
    createdAt: '2024-01-14T11:15:00Z',
  },
];

const priorityColors = {
  high: 'bg-red-100 text-red-800 border-red-200',
  medium: 'bg-amber-100 text-amber-800 border-amber-200',
  low: 'bg-green-100 text-green-800 border-green-200',
};

export default function NotesSection() {
  const pendingNotes = mockNotes.filter((note) => !note.completed);
  const completedCount = mockNotes.filter((note) => note.completed).length;

  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StickyNote className="h-5 w-5 text-amber-600" />
            <CardTitle className="text-lg font-semibold">
              Notes & Tasks
            </CardTitle>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-8 px-2 bg-transparent"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{pendingNotes.length} pending</span>
          <span>{completedCount} completed</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {pendingNotes.map((note) => (
          <div
            key={note.id}
            className="group p-3 rounded-lg border bg-card hover:bg-accent/50 cursor-pointer"
          >
            <div className="flex items-start gap-3">
              <button className="mt-0.5 text-muted-foreground hover:text-foreground">
                <Circle className="h-4 w-4" />
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-sm text-balance leading-tight">
                    {note.title}
                  </h4>
                  <Badge
                    variant="outline"
                    className={`text-xs px-1.5 py-0.5 ${priorityColors[note.priority as keyof typeof priorityColors]}`}
                  >
                    {note.priority}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground text-pretty leading-relaxed mb-2">
                  {note.content}
                </p>
                <time className="text-xs text-muted-foreground">
                  {new Date(note.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </time>
              </div>
            </div>
          </div>
        ))}

        {completedCount > 0 && (
          <div className="pt-2 border-t">
            <details className="group">
              <summary className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer hover:text-foreground">
                <CheckCircle2 className="h-4 w-4" />
                <span>Show {completedCount} completed</span>
              </summary>
              <div className="mt-3 space-y-2">
                {mockNotes
                  .filter((note) => note.completed)
                  .map((note) => (
                    <div
                      key={note.id}
                      className="p-2 rounded-lg bg-muted/30 opacity-75"
                    >
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-medium text-sm line-through text-muted-foreground">
                            {note.title}
                          </h4>
                          <time className="text-xs text-muted-foreground">
                            {new Date(note.createdAt).toLocaleDateString(
                              'en-US',
                              {
                                month: 'short',
                                day: 'numeric',
                              },
                            )}
                          </time>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </details>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
