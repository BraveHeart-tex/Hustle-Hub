import { PlusIcon, StickyNote } from 'lucide-react';
import { useState } from 'react';

import FilterButton from '@/components/newtab/FilterButton';
import NoteFormSheet from '@/components/newtab/notes/NoteFormSheet';
import NoteItem from '@/components/newtab/notes/NoteItem';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNotes } from '@/lib/storage/notes';
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

  const priorityStats = useMemo(() => {
    if (!notes || notes.length === 0) return [];

    const map: Record<string, number> = {};

    for (const note of notes) {
      map[note.priority] = (map[note.priority] ?? 0) + 1;
    }

    return Object.entries(map).map(([label, count]) => ({
      label,
      count,
    }));
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

  const shouldShowPriorityFilters = priorityStats.some((p) => p.count > 1);

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
          {shouldShowPriorityFilters && (
            <div className="flex items-center gap-2 flex-nowrap whitespace-nowrap overflow-x-auto">
              {priorityStats.map((priority) => (
                <FilterButton
                  key={priority.label}
                  active={selectedPriority === priority.label}
                  onClick={() =>
                    setSelectedPriority((prev) =>
                      prev === priority.label ? '' : priority.label,
                    )
                  }
                >
                  {priority.label} {priority.count > 1 && `(${priority.count})`}
                </FilterButton>
              ))}
            </div>
          )}
        </CardHeader>
        <CardContent className="flex-1 space-y-3 overflow-auto pt-2">
          {filteredNotes.length > 0 ? (
            filteredNotes.map((note) => (
              <NoteItem
                key={note.id}
                note={note}
                onNoteClick={handleItemClick}
              />
            ))
          ) : (
            <p className="text-muted-foreground">No notes found.</p>
          )}
        </CardContent>
      </Card>
    </>
  );
}
