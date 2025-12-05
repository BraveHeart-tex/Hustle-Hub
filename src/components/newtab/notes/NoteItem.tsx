import { TextAlignStart, TrashIcon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { removeNote } from '@/lib/storage/notes';
import { Note } from '@/types/notes';

interface NoteItemProps {
  note: Note;
  onNoteClick: (note: Note) => void;
}

const noteDateFormatter = new Intl.DateTimeFormat('tr-TR', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

const notePriorityColors = {
  high: 'bg-destructive text-destructive-foreground border-destructive',
  medium:
    'bg-amber-200 text-amber-900 border-amber-200 dark:bg-amber-800 dark:text-amber-100 dark:border-amber-700',
  low: 'bg-green-200 text-green-900 border-green-200 dark:bg-green-800 dark:text-green-100 dark:border-green-700',
};

const NoteItem = ({ note, onNoteClick }: NoteItemProps) => {
  const handleDelete = async (noteId: string) => {
    const shouldDelete = confirm('Are you sure you want to delete this note?');
    if (shouldDelete) {
      await removeNote(noteId);
    }
  };

  return (
    <div
      key={note.id}
      className="p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors dark:hover:bg-accent/50 flex flex-col justify-between"
      onClick={() => onNoteClick(note)}
    >
      <div className="flex-1 min-w-0 mb-1">
        <h4 className="font-medium text-sm text-balance leading-tight">
          {note.title}
        </h4>
        {note.createdAt !== undefined && (
          <time className="text-xs text-muted-foreground">
            {noteDateFormatter.format(new Date(note.createdAt))}
          </time>
        )}
      </div>

      <div className="w-full flex items-center justify-between mt-2">
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={`text-xs px-1.5 py-0.5 ${notePriorityColors[note.priority as keyof typeof notePriorityColors]} capitalize`}
          >
            {note.priority}
          </Badge>
          {!!note.content && note.content.trim().length > 0 && (
            <TextAlignStart className="w-4 h-4" />
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          onClick={(event) => {
            event.stopPropagation();
            handleDelete(note.id);
          }}
        >
          <TrashIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default NoteItem;
