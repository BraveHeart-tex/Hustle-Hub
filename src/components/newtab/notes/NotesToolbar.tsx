import { SearchIcon } from 'lucide-react';

import { useNotesPage } from '@/components/newtab/notes/useNotesPage';

export const NotesToolbar = () => {
  const { searchQuery, setSearchQuery } = useNotesPage();

  return (
    <div className="rounded-md bg-muted/30 px-3 py-1.5 outline-none transition-[background-color,box-shadow] focus-within:bg-muted/45 focus-within:ring-ring/50 focus-within:ring-[3px] motion-reduce:transition-none dark:bg-muted/40 dark:focus-within:bg-muted/55">
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
