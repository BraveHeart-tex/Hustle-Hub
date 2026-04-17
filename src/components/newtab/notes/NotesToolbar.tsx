import { SearchIcon } from 'lucide-react';

import { useNotesPage } from './useNotesPage';

const NotesToolbar = () => {
  const { searchQuery, setSearchQuery } = useNotesPage();

  return (
    <div className="rounded-lg border border-border bg-secondary dark:bg-muted/60 px-3 py-2">
      <div className="flex items-center gap-2">
        <SearchIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search notes..."
          className="h-7 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
      </div>
    </div>
  );
};

export default NotesToolbar;
