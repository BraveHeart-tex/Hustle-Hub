import { NoteDetail } from '@/components/newtab/notes/NoteDetail';
import { NotesList } from '@/components/newtab/notes/NotesList';
import { NotesSidebar } from '@/components/newtab/notes/NotesSidebar';
import { NotesPageProvider } from '@/components/newtab/notes/useNotesPage';

export const NotesPage = () => {
  return (
    <NotesPageProvider>
      <div className="flex h-[calc(100vh-110px)] gap-0 overflow-hidden rounded-xl border border-border bg-card">
        <NotesSidebar />
        <NotesList />
        <NoteDetail />
      </div>
    </NotesPageProvider>
  );
};
