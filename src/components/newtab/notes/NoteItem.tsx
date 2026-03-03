import { PopoverClose } from '@radix-ui/react-popover';
import { AlertCircleIcon, TextAlignStart, TrashIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
    await removeNote(noteId);
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

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              onClick={(event) => event.stopPropagation()}
            >
              <TrashIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>

          <PopoverContent
            side="top"
            align="end"
            className="w-72 p-0 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center gap-2 px-3 py-2.5 border-b bg-destructive/5">
              <AlertCircleIcon className="h-4 w-4 text-destructive shrink-0" />
              <span className="text-sm font-medium text-destructive">
                Delete note?
              </span>
            </div>

            {/* Content */}
            <div className="px-3 py-3 text-xs text-muted-foreground">
              This action cannot be undone.
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 px-3 py-2 border-t bg-muted/30">
              <PopoverClose>
                <Button variant="ghost" size="sm" className="h-8">
                  Cancel
                </Button>
              </PopoverClose>

              <Button
                size="sm"
                className="h-8 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={async (event) => {
                  event.stopPropagation();
                  await handleDelete(note.id);
                }}
              >
                Delete
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

export default NoteItem;
