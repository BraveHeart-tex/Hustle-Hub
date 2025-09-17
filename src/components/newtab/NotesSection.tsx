import { PlusIcon, StickyNote } from 'lucide-react';
import { useMemo, useState } from 'react';

import NoteFormDialog from '@/components/newtab/notes/NoteFormDialog';
import NoteItem from '@/components/newtab/notes/NoteItem';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNotes } from '@/lib/storage/notes';
import { Note } from '@/types/notes';

export default function NotesSection() {
  const [filter, setFilter] = useState<'pending' | 'completed'>('pending');
  const [dialogState, setDialogState] = useState<{
    selectedItem: Note | undefined;
    open: boolean;
  }>({
    selectedItem: undefined,
    open: false,
  });
  const { notes } = useNotes();

  const completedCount = useMemo(
    () => notes.filter((note) => note.completed).length,
    [notes],
  );

  const filteredNotes = useMemo(() => {
    if (filter === 'pending') {
      return notes.filter((note) => !note.completed);
    }
    return notes.filter((note) => note.completed);
  }, [filter, notes]);

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

  return (
    <>
      <NoteFormDialog
        selectedItem={dialogState.selectedItem}
        isOpen={dialogState.open}
        onOpenChange={handleDialogClose}
      />
      <Card className="h-fit">
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
          <div className="flex items-center gap-4 text-sm">
            <Button
              variant={filter === 'pending' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('pending')}
            >
              {notes.length - completedCount} pending
            </Button>
            <Button
              variant={filter === 'completed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('completed')}
            >
              {completedCount} completed
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {filteredNotes.map((note) => (
            <NoteItem key={note.id} note={note} onNoteClick={handleItemClick} />
          ))}
        </CardContent>
      </Card>
    </>
  );
}
