import { PlusIcon, StickyNote } from 'lucide-react';
import { useState } from 'react';

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
  const { notes } = useNotes();

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
        </CardHeader>
        <CardContent className="flex-1 space-y-3 overflow-auto pt-2">
          {notes.map((note) => (
            <NoteItem key={note.id} note={note} onNoteClick={handleItemClick} />
          ))}
        </CardContent>
      </Card>
    </>
  );
}
