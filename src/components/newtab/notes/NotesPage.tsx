import NoteDetail from './NoteDetail';
import NotesList from './NotesList';
import NotesSidebar from './NotesSidebar';
import { NotesPageProvider } from './useNotesPage';

const NotesPage = () => {
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

export default NotesPage;
