import { PlusIcon, StickyNote } from 'lucide-react';
import { useState } from 'react';

import NoteFormSheet from '@/components/newtab/notes/NoteFormSheet';
import NoteItem from '@/components/newtab/notes/NoteItem';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNotes } from '@/lib/storage/notes';
import { cn } from '@/lib/utils';
import { Note } from '@/types/notes';

export default function NotesSection() {
  const [dialogState, setDialogState] = useState<{
    selectedItem: Note | undefined;
    open: boolean;
  }>({
    selectedItem: undefined,
    open: false,
  });
  const [selectedPriority, setSelectedPriority] = useState('');

  const { notes } = useNotes();

  const priorityOptions = useMemo(() => {
    if (!notes || notes.length === 0) return [];

    return notes.reduce<string[]>((priorities, note) => {
      if (!priorities.includes(note.priority)) {
        priorities.push(note.priority);
      }

      return priorities;
    }, []);
  }, [notes]);

  const handleItemClick = useCallback((selectedItem: Note) => {
    setDialogState({
      selectedItem,
      open: true,
    });
  }, []);

  const handleDialogClose = useCallback(() => {
    setDialogState({
      selectedItem: undefined,
      open: false,
    });
  }, []);

  const filteredNotes = useMemo(() => {
    if (!selectedPriority) return notes;

    return notes.filter((note) => note.priority === selectedPriority);
  }, [notes, selectedPriority]);

  const priorityCount = useMemo(() => {
    if (!notes) return {};

    return notes.reduce<Record<string, number>>((countMap, note) => {
      countMap[note.priority] = (countMap[note.priority] || 0) + 1;
      return countMap;
    }, {});
  }, [notes]);

  return (
    <>
      <NoteFormSheet
        selectedItem={dialogState.selectedItem}
        isOpen={dialogState.open}
        onOpenChange={handleDialogClose}
      />
      <Card className="max-h-[calc(100vh-110px)] flex flex-col">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StickyNote className="h-5 w-5 text-amber-600" />
              <CardTitle className="text-lg font-semibold">Notes</CardTitle>
            </div>
            <Button
              size="icon"
              variant="outline"
              onClick={() => {
                setDialogState({
                  selectedItem: undefined,
                  open: true,
                });
              }}
            >
              <PlusIcon />
            </Button>
          </div>
          {priorityOptions.length > 1 && (
            <div className="flex items-center gap-2 flex-nowrap whitespace-nowrap overflow-x-auto">
              {priorityOptions.map((priority) => (
                <Button
                  key={priority}
                  size={'sm'}
                  variant={
                    selectedPriority === priority ? 'default' : 'outline'
                  }
                  className={cn(
                    selectedPriority === priority && 'border dark:border-input',
                    'capitalize',
                  )}
                  onClick={() =>
                    setSelectedPriority((prev) =>
                      prev === priority ? '' : priority,
                    )
                  }
                >
                  {priority}{' '}
                  {priorityCount[priority] > 0 &&
                    `(${priorityCount[priority]})`}
                </Button>
              ))}
            </div>
          )}
        </CardHeader>
        <CardContent className="flex-1 space-y-3 overflow-auto pt-2">
          {filteredNotes.map((note) => (
            <NoteItem key={note.id} note={note} onNoteClick={handleItemClick} />
          ))}
        </CardContent>
      </Card>
    </>
  );
}
