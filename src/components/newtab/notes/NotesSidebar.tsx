import {
  ArchiveIcon,
  LayoutListIcon,
  type LucideIcon,
  PinIcon,
} from 'lucide-react';
import { type ReactNode } from 'react';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

import NotesToolbar from './NotesToolbar';
import { type NotesFilter, useNotesPage } from './useNotesPage';

interface FilterItem {
  value: NotesFilter;
  label: string;
  icon?: LucideIcon;
  dot?: string;
}

const filters: FilterItem[] = [
  { value: 'all', label: 'All', icon: LayoutListIcon },
  { value: 'pinned', label: 'Pinned', icon: PinIcon },
  { value: 'high', label: 'High', dot: 'bg-red-500' },
  { value: 'low', label: 'Low', dot: 'bg-blue-500' },
  { value: 'archived', label: 'Archived', icon: ArchiveIcon },
];

const NotesSidebar = () => {
  const {
    activeFilter,
    activeTag,
    clearFilters,
    filterCounts,
    setActiveFilter,
    setActiveTag,
    tagSummaries,
  } = useNotesPage();

  const renderFilterIcon = (filter: FilterItem): ReactNode => {
    if (filter.icon) {
      const Icon = filter.icon;
      return <Icon className="h-4 w-4" />;
    }

    return <span className={cn('h-2 w-2 rounded-full', filter.dot)} />;
  };

  return (
    <aside className="flex w-[260px] shrink-0 flex-col border-r border-border bg-card">
      <div className="space-y-5 p-4">
        <NotesToolbar />

        <div className="space-y-1">
          {filters.map((filter) => {
            const isActive = activeFilter === filter.value && !activeTag;

            return (
              <button
                key={filter.value}
                type="button"
                onClick={() => {
                  setActiveFilter(filter.value);
                  setActiveTag(null);
                }}
                className={cn(
                  'flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
                )}
              >
                <span className="flex items-center gap-2">
                  {renderFilterIcon(filter)}
                  {filter.label}
                </span>
                <span className="text-xs text-muted-foreground">
                  {filterCounts[filter.value]}
                </span>
              </button>
            );
          })}
        </div>

        <div className="space-y-3">
          <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Tags
          </p>

          <div className="flex flex-wrap gap-2">
            {tagSummaries.length > 0 ? (
              tagSummaries.map((tag) => (
                <button
                  key={tag.name}
                  type="button"
                  onClick={() => {
                    setActiveTag(tag.name);
                    setActiveFilter('all');
                  }}
                  className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <Badge
                    variant="secondary"
                    className={cn(
                      'cursor-pointer gap-1.5 transition-colors',
                      activeTag === tag.name &&
                        'bg-accent text-accent-foreground',
                    )}
                  >
                    {tag.name}
                    <span className="text-muted-foreground">{tag.count}</span>
                  </Badge>
                </button>
              ))
            ) : (
              <p className="px-3 text-sm text-muted-foreground">No tags yet</p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-auto border-t border-border p-4">
        <button
          type="button"
          onClick={clearFilters}
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Clear filters
        </button>
      </div>
    </aside>
  );
};

export default NotesSidebar;
