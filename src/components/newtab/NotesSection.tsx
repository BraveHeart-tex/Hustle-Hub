import { PlusIcon, StickyNote } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

import FilterButton from '@/components/newtab/FilterButton';
import NoteFormSheet from '@/components/newtab/notes/NoteFormSheet';
import NoteItem from '@/components/newtab/notes/NoteItem';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NOTE_PRIORITIES } from '@/lib/constants';
import { useNotes } from '@/lib/storage/notes';
import { cn } from '@/lib/utils';
import { Note } from '@/types/notes';

interface NotesSectionProps {
  className?: string;
}

const PRIORITY_FILTER_ORDER = [
  NOTE_PRIORITIES.HIGH,
  NOTE_PRIORITIES.MEDIUM,
  NOTE_PRIORITIES.LOW,
] as const;

export default function NotesSection({ className }: NotesSectionProps) {
  const [dialogState, setDialogState] = useState<{
    selectedItem: Note | undefined;
    open: boolean;
  }>({ selectedItem: undefined, open: false });

  const [selectedPriority, setSelectedPriority] = useState('');
  const { notes } = useNotes();

  const priorityStats = useMemo(() => {
    if (!notes.length) return [];
    const map: Record<string, number> = {};
    for (const note of notes) {
      map[note.priority] = (map[note.priority] ?? 0) + 1;
    }
    return PRIORITY_FILTER_ORDER.filter((p) => map[p] !== undefined).map(
      (p) => ({ label: p, count: map[p] }),
    );
  }, [notes]);

  const handleItemClick = useCallback((selectedItem: Note) => {
    setDialogState({ selectedItem, open: true });
  }, []);

  const handleDialogClose = useCallback(() => {
    setDialogState({ selectedItem: undefined, open: false });
  }, []);

  const filteredNotes = useMemo(() => {
    if (!selectedPriority) return notes;
    return notes.filter((note) => note.priority === selectedPriority);
  }, [notes, selectedPriority]);

  const shouldShowPriorityFilters = priorityStats.length > 1;

  return (
    <>
      <NoteFormSheet
        selectedItem={dialogState.selectedItem}
        isOpen={dialogState.open}
        onOpenChange={handleDialogClose}
      />
      <Card className={cn('flex flex-col overflow-hidden', className)}>
        <CardHeader className="shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StickyNote className="h-5 w-5 text-amber-600" />
              <CardTitle className="text-lg font-semibold">Notes</CardTitle>
            </div>
            <Button
              size="icon"
              variant="outline"
              onClick={() =>
                setDialogState({ selectedItem: undefined, open: true })
              }
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
        <CardContent className="flex-1 space-y-3 overflow-y-auto min-h-0 pt-2">
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
