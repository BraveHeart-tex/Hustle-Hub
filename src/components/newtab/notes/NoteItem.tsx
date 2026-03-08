import { PopoverClose } from '@radix-ui/react-popover';
import { AlertCircleIcon, FileTextIcon, TrashIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { removeNote, updateNote } from '@/lib/storage/notes';
import { cn } from '@/lib/utils';
import { type Note } from '@/types/notes';

import { NotePriorityDropdown } from './NotePriorityDropdown';

const PRIORITY_BAR: Record<string, string> = {
  high: 'bg-red-500',
  medium: 'bg-amber-400',
  low: 'bg-blue-400',
};

interface NoteItemProps {
  note: Note;
  onNoteClick: (note: Note) => void;
}

const NoteItem = ({ note, onNoteClick }: NoteItemProps) => {
  return (
    <div
      className="group relative flex items-center gap-3 rounded-lg border border-border px-3 py-2 hover:bg-muted/50 dark:hover:bg-accent/50 transition-colors cursor-pointer"
      onClick={() => onNoteClick(note)}
    >
      <div
        className={cn(
          'absolute left-0 top-2 bottom-2 w-[3px] rounded-full',
          PRIORITY_BAR[note.priority] ?? 'bg-border',
        )}
      />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-snug truncate">
          {note.title}
        </p>
        {!!note.content && note.content.trim().length > 0 && (
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground/50 mt-0.5">
            <FileTextIcon className="size-3" />
            has notes
          </span>
        )}
      </div>

      <div
        className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => e.stopPropagation()}
      >
        <NotePriorityDropdown
          value={note.priority}
          onChange={(priority) => updateNote(note.id, { priority })}
        />

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-4 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <TrashIcon className="size-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            side="top"
            align="end"
            className="w-64 p-0 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 px-3 py-2.5 border-b bg-destructive/5">
              <AlertCircleIcon className="h-4 w-4 text-destructive shrink-0" />
              <span className="text-sm font-medium text-destructive">
                Delete note?
              </span>
            </div>
            <div className="px-3 py-2.5 text-xs text-muted-foreground">
              This action cannot be undone.
            </div>
            <div className="flex items-center justify-end gap-2 px-3 py-2 border-t bg-muted/30">
              <PopoverClose asChild>
                <Button variant="ghost" size="sm" className="h-7">
                  Cancel
                </Button>
              </PopoverClose>
              <Button
                size="sm"
                className="h-7 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={async (e) => {
                  e.stopPropagation();
                  await removeNote(note.id);
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
