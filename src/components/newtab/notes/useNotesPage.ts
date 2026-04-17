import {
  createContext,
  createElement,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useNotes } from '@/lib/storage/notes';
import { type Note } from '@/types/notes';

export type NotesFilter = 'all' | 'pinned' | 'high' | 'low' | 'archived';
export type NotesSort = 'created' | 'priority';

interface TagSummary {
  name: string;
  count: number;
}

interface FilterCounts {
  all: number;
  pinned: number;
  high: number;
  low: number;
  archived: number;
}

interface NotesPageState {
  notes: Note[];
  filteredNotes: Note[];
  selectedNote: Note | null;
  selectedNoteId: string | null;
  setSelectedNoteId: Dispatch<SetStateAction<string | null>>;
  searchQuery: string;
  setSearchQuery: Dispatch<SetStateAction<string>>;
  activeFilter: NotesFilter;
  setActiveFilter: Dispatch<SetStateAction<NotesFilter>>;
  activeTag: string | null;
  setActiveTag: Dispatch<SetStateAction<string | null>>;
  sortBy: NotesSort;
  setSortBy: Dispatch<SetStateAction<NotesSort>>;
  tagSummaries: TagSummary[];
  filterCounts: FilterCounts;
  clearFilters: () => void;
}

const NotesPageContext = createContext<NotesPageState | null>(null);

const priorityOrder: Record<Note['priority'], number> = {
  high: 0,
  medium: 1,
  low: 2,
};

const stripHtml = (value: string) => value.replace(/<[^>]+>/g, ' ');

const normalized = (value: string) => value.toLowerCase().replace(/\s+/g, ' ');

const fuzzyIncludes = (value: string, target: string) => {
  const source = normalized(value);

  if (!target) {
    return true;
  }

  if (source.includes(target)) {
    return true;
  }

  let queryIndex = 0;
  for (const char of source) {
    if (char === target[queryIndex]) {
      queryIndex += 1;
    }
    if (queryIndex === target.length) {
      return true;
    }
  }

  return false;
};

const timestamp = (value?: string) => {
  if (!value) {
    return 0;
  }

  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
};

interface NotesPageProviderProps {
  children: ReactNode;
}

export const NotesPageProvider = ({ children }: NotesPageProviderProps) => {
  const { notes } = useNotes();
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<NotesFilter>('all');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<NotesSort>('created');

  const filterCounts = useMemo<FilterCounts>(
    () => ({
      all: notes.filter((note) => !note.archived).length,
      pinned: notes.filter((note) => note.pinned && !note.archived).length,
      high: notes.filter((note) => note.priority === 'high' && !note.archived)
        .length,
      low: notes.filter((note) => note.priority === 'low' && !note.archived)
        .length,
      archived: notes.filter((note) => note.archived).length,
    }),
    [notes],
  );

  const tagSummaries = useMemo<TagSummary[]>(() => {
    const counts = new Map<string, number>();

    for (const note of notes) {
      if (note.archived || !note.tags?.length) {
        continue;
      }

      for (const tag of note.tags) {
        const cleanTag = tag.trim();
        if (cleanTag) {
          counts.set(cleanTag, (counts.get(cleanTag) ?? 0) + 1);
        }
      }
    }

    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [notes]);

  const filteredNotes = useMemo(() => {
    const nextNotes: Note[] = [];
    const cleanSearchQuery = normalized(searchQuery).trim();

    for (const note of notes) {
      let isMatch = true;

      if (activeTag) {
        isMatch = note.tags?.includes(activeTag) ?? false;
      } else if (activeFilter === 'archived') {
        isMatch = note.archived === true;
      } else if (note.archived) {
        isMatch = false;
      } else if (activeFilter === 'pinned') {
        isMatch = note.pinned === true;
      } else if (activeFilter === 'high' || activeFilter === 'low') {
        isMatch = note.priority === activeFilter;
      }

      if (!isMatch) {
        continue;
      }

      if (
        cleanSearchQuery &&
        !fuzzyIncludes(
          `${note.title} ${stripHtml(note.content)}`,
          cleanSearchQuery,
        )
      ) {
        continue;
      }

      nextNotes.push(note);
    }

    return nextNotes.sort((a, b) => {
      if (sortBy === 'priority') {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }

      return timestamp(b.createdAt) - timestamp(a.createdAt);
    });
  }, [activeFilter, activeTag, notes, searchQuery, sortBy]);

  const selectedNote = useMemo(
    () => notes.find((note) => note.id === selectedNoteId) ?? null,
    [notes, selectedNoteId],
  );

  useEffect(() => {
    if (selectedNoteId) {
      return;
    }

    setSelectedNoteId(filteredNotes[0]?.id ?? null);
  }, [filteredNotes, selectedNoteId]);

  const clearFilters = () => {
    setActiveFilter('all');
    setActiveTag(null);
    setSearchQuery('');
  };

  return createElement(
    NotesPageContext.Provider,
    {
      value: {
        notes,
        filteredNotes,
        selectedNote,
        selectedNoteId,
        setSelectedNoteId,
        searchQuery,
        setSearchQuery,
        activeFilter,
        setActiveFilter,
        activeTag,
        setActiveTag,
        sortBy,
        setSortBy,
        tagSummaries,
        filterCounts,
        clearFilters,
      },
    },
    children,
  );
};

export const useNotesPage = () => {
  const context = useContext(NotesPageContext);

  if (!context) {
    throw new Error('useNotesPage must be used within NotesPageProvider');
  }

  return context;
};
