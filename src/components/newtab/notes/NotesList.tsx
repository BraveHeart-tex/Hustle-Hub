import { ChevronDownIcon, PinIcon, PlusIcon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { addNote } from '@/lib/storage/notes';
import { cn } from '@/lib/utils';
import { type Note } from '@/types/notes';

import { type NotesSort, useNotesPage } from './useNotesPage';

const priorityDot: Record<Note['priority'], string> = {
  high: 'bg-red-500',
  medium: 'bg-yellow-500',
  low: 'bg-blue-500',
};

const sortLabels: Record<NotesSort, string> = {
  created: 'Created',
  priority: 'Priority',
};

const stripHtml = (content: string) =>
  content
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const formatRelativeTime = (value?: string) => {
  if (!value) {
    return 'No date';
  }

  const date = new Date(value);
  const diffSeconds = Math.max(
    0,
    Math.floor((Date.now() - date.getTime()) / 1000),
  );

  if (Number.isNaN(date.getTime())) {
    return 'No date';
  }

  if (diffSeconds < 60) {
    return 'just now';
  }

  const intervals = [
    { unit: 'year', seconds: 31536000 },
    { unit: 'month', seconds: 2592000 },
    { unit: 'week', seconds: 604800 },
    { unit: 'day', seconds: 86400 },
    { unit: 'hour', seconds: 3600 },
    { unit: 'minute', seconds: 60 },
  ];

  const interval = intervals.find((item) => diffSeconds >= item.seconds);
  if (!interval) {
    return 'just now';
  }

  const count = Math.floor(diffSeconds / interval.seconds);
  return `${count} ${interval.unit}${count === 1 ? '' : 's'} ago`;
};

const NotesList = () => {
  const {
    filteredNotes,
    selectedNoteId,
    setSelectedNoteId,
    setSortBy,
    sortBy,
  } = useNotesPage();

  const handleCreateNote = async () => {
    const noteId = crypto.randomUUID();
    const now = new Date().toISOString();

    await addNote({
      id: noteId,
      title: 'Untitled',
      content: '',
      priority: 'low',
      tags: [],
      tasks: [],
      pinned: false,
      updatedAt: now,
    });

    setSelectedNoteId(noteId);
  };

  return (
    <section className="flex w-[340px] shrink-0 flex-col border-r border-border bg-background">
      <div className="border-b border-border p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-foreground">
            {filteredNotes.length} notes
          </p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 gap-1 px-2">
                Sort: {sortLabels[sortBy]}
                <ChevronDownIcon className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {Object.entries(sortLabels).map(([value, label]) => (
                <DropdownMenuItem
                  key={value}
                  onClick={() => setSortBy(value as NotesSort)}
                >
                  {label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Button
          type="button"
          className="w-full justify-start gap-2"
          variant="outline"
          onClick={() => void handleCreateNote()}
        >
          <PlusIcon className="h-4 w-4" />
          New Note
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        <div className="space-y-2">
          {filteredNotes.map((note) => {
            const isSelected = note.id === selectedNoteId;

            return (
              <button
                key={note.id}
                type="button"
                onClick={() => {
                  if (note.id !== selectedNoteId) {
                    setSelectedNoteId(note.id);
                  }
                }}
                className={cn(
                  'w-full rounded-lg border bg-card p-3 text-left transition-colors hover:bg-accent/50',
                  isSelected
                    ? 'border-primary ring-2 ring-primary/15'
                    : 'border-border',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-foreground">
                      {note.title || 'Untitled'}
                    </p>
                    <p className="mt-1 truncate text-sm text-muted-foreground">
                      {stripHtml(note.content) || 'No content yet'}
                    </p>
                  </div>
                  {note.pinned && (
                    <PinIcon className="h-4 w-4 shrink-0 fill-yellow-500 text-yellow-500" />
                  )}
                </div>

                <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span
                    className={cn(
                      'h-2 w-2 rounded-full',
                      priorityDot[note.priority],
                    )}
                  />
                  <span className="capitalize">{note.priority}</span>
                  <span>·</span>
                  <span>
                    {formatRelativeTime(note.updatedAt ?? note.createdAt)}
                  </span>
                </div>

                {!!note.tags?.length && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {note.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="text-[10px]"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </button>
            );
          })}

          {filteredNotes.length === 0 && (
            <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              No notes match these filters.
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default NotesList;
