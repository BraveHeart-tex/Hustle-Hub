import { TextAlignStart, TrashIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { removeNote, updateNote } from '@/lib/storage/notes';
import { formatDate } from '@/lib/utils/formatters/formatDate';
import { Note } from '@/types/notes';

import { NotePriorityDropdown } from './NotePriorityDropdown';

interface NoteItemProps {
  note: Note;
  onNoteClick: (note: Note) => void;
}

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
            {formatDate(note.createdAt)}
          </time>
        )}
      </div>

      <div className="w-full flex items-center justify-between mt-2">
        <div className="flex items-center gap-2">
          <NotePriorityDropdown
            value={note.priority}
            onChange={(priority) => {
              updateNote(note.id, { priority });
            }}
          />
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
