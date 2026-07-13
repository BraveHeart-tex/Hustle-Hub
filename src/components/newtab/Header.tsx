import { useIsFetching, useQueryClient } from '@tanstack/react-query';
import {
  LayoutDashboardIcon,
  NotebookTextIcon,
  RefreshCwIcon,
  SearchIcon,
  ZapIcon,
} from 'lucide-react';

import { AppSettings } from '@/components/newtab/AppSettings';
import { KeyboardShortcutKey } from '@/components/newtab/KeyboardShortcutKey';
import { SEARCH_SHORTCUT } from '@/components/newtab/keyboardShortcuts';
import { KeyboardShortcutsHelp } from '@/components/newtab/KeyboardShortcutsHelp';
import { AllCommentsWidget } from '@/components/newtab/misc/AllCommentsWidget';
import { ModeToggle } from '@/components/newtab/ModeToggle';
import { OPEN_SEARCH_EVENT } from '@/components/newtab/SearchDialog';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useHashRoute } from '@/lib/router';
import { useNotes } from '@/lib/storage/notes';
import { cn } from '@/lib/utils';

export function Header() {
  const queryClient = useQueryClient();
  const isFetching = useIsFetching();
  const { notes } = useNotes();
  const { route, navigate } = useHashRoute();

  const handleRefreshData = () => {
    void queryClient.refetchQueries({ type: 'active' });
  };

  const handleOpenSearch = () => {
    document.dispatchEvent(new Event(OPEN_SEARCH_EVENT));
  };

  return (
    <header className="border-b border-border bg-card">
      <div className="px-4 py-3">
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <ZapIcon
                className="h-4 w-4 text-primary-foreground"
                fill="currentColor"
              />
            </div>
            <h1 className="text-xl font-bold text-foreground">Hustle Hub</h1>
          </div>
          <div className="flex items-center justify-self-center gap-3">
            <nav
              aria-label="Primary"
              className="flex items-center gap-1 rounded-lg border border-border bg-muted/40 p-1"
            >
              <button
                type="button"
                onClick={() => navigate('/')}
                aria-current={route === '/' ? 'page' : undefined}
                className={cn(
                  'inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors',
                  'outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px]',
                  route === '/'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-background/70 hover:text-foreground',
                )}
              >
                <LayoutDashboardIcon className="h-4 w-4" />
                Dashboard
              </button>
              <button
                type="button"
                onClick={() => navigate('/notes')}
                aria-current={route === '/notes' ? 'page' : undefined}
                className={cn(
                  'inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors',
                  'outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px]',
                  route === '/notes'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-background/70 hover:text-foreground',
                )}
              >
                <NotebookTextIcon className="h-4 w-4" />
                Notes
                <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold leading-5 text-primary-foreground">
                  {notes.length}
                </span>
              </button>
            </nav>
            <Button
              type="button"
              variant="outline"
              onClick={handleOpenSearch}
              className="h-9 justify-between px-2 text-muted-foreground lg:min-w-48 lg:px-3"
              aria-label="Search work"
              aria-keyshortcuts={SEARCH_SHORTCUT.ariaKeyShortcuts}
            >
              <span className="flex items-center gap-2">
                <SearchIcon aria-hidden="true" className="size-4" />
                <span className="hidden lg:inline">Search work</span>
              </span>
              <span className="flex items-center gap-1" aria-hidden="true">
                {SEARCH_SHORTCUT.keys.map((key) => (
                  <KeyboardShortcutKey key={key}>{key}</KeyboardShortcutKey>
                ))}
              </span>
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <AllCommentsWidget />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleRefreshData}
                    disabled={isFetching > 0}
                    aria-label={
                      isFetching > 0 ? 'Refreshing data' : 'Refresh data'
                    }
                  >
                    <RefreshCwIcon
                      aria-hidden="true"
                      className={cn(
                        'h-5 w-5',
                        isFetching > 0 && 'animate-spin',
                      )}
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh data</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <div className="flex items-center divide-x divide-border overflow-hidden rounded-md border border-border bg-background [&_[data-slot=button]]:rounded-none [&_[data-slot=button]]:border-0">
              <KeyboardShortcutsHelp />
              <ModeToggle />
              <AppSettings />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
