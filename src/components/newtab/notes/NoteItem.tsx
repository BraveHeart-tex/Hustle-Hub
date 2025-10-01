import { CheckIcon, TrashIcon, UndoIcon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { removeNote, updateNote } from '@/lib/storage/notes';
import { Note } from '@/types/notes';

const priorityColors = {
  high: 'bg-destructive text-destructive-foreground border-destructive',
  medium:
    'bg-amber-200 text-amber-900 border-amber-200 dark:bg-amber-800 dark:text-amber-100 dark:border-amber-700',
  low: 'bg-green-200 text-green-900 border-green-200 dark:bg-green-800 dark:text-green-100 dark:border-green-700',
};

interface NoteItemProps {
  note: Note;
  onNoteClick: (note: Note) => void;
}

const NoteItem = ({ note, onNoteClick }: NoteItemProps) => {
  const toggleNoteStatus = async (completed: boolean) => {
    await updateNote(note.id, {
      completed,
    });
  };

  const handleDelete = async (noteId: string) => {
    const shouldDelete = confirm('Are you sure you want to delete this note?');
    if (shouldDelete) {
      await removeNote(noteId);
    }
  };

  return (
    <div
      key={note.id}
      className="p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors dark:hover:bg-accent/50"
      onClick={() => onNoteClick(note)}
    >
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
        <p className="text-xs text-muted-foreground text-pretty leading-relaxed mb-2 truncate">
          {note.content}
        </p>
        {note.createdAt !== undefined && (
          <time className="text-xs text-muted-foreground">
            {new Date(note.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </time>
        )}
      </div>
      <div className="w-full flex items-center justify-end gap-2">
        <Button
          variant="destructive"
          size="icon"
          onClick={(event) => {
            event.stopPropagation();
            handleDelete(note.id);
          }}
        >
          <TrashIcon />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={(event) => {
            event.stopPropagation();
            toggleNoteStatus(!note.completed);
          }}
        >
          {note.completed ? <UndoIcon /> : <CheckIcon />}
        </Button>
      </div>
    </div>
  );
};
export default NoteItem;
