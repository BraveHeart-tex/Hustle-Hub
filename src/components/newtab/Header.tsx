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
import {
  OPEN_SEARCH_EVENT,
  type OpenSearchEventDetail,
  SEARCH_TRIGGER_ID,
} from '@/components/newtab/SearchDialog';
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

function tabClassName(isActive: boolean) {
  return cn(
    'relative inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium motion-safe:transition-colors',
    'outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px]',
    isActive
      ? 'text-foreground'
      : 'text-muted-foreground hover:text-foreground',
  );
}

function TabIndicator() {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-foreground"
    />
  );
}

export function Header() {
  const queryClient = useQueryClient();
  const isFetching = useIsFetching();
  const { notes } = useNotes();
  const { route, navigate } = useHashRoute();

  const handleRefreshData = () => {
    void queryClient.refetchQueries({ type: 'active' });
  };

  const handleOpenSearch = (trigger: HTMLElement) => {
    document.dispatchEvent(
      new CustomEvent<OpenSearchEventDetail>(OPEN_SEARCH_EVENT, {
        detail: { trigger },
      }),
    );
  };

  return (
    <header className="border-b border-border bg-card">
      <div className="px-4 py-3">
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <ZapIcon
                  className="h-4 w-4 text-primary-foreground"
                  fill="currentColor"
                />
              </div>
              <h1 className="text-lg font-semibold text-foreground">
                Hustle Hub
              </h1>
            </div>
            <nav aria-label="Primary" className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => navigate('/')}
                aria-current={route === '/' ? 'page' : undefined}
                className={tabClassName(route === '/')}
              >
                <LayoutDashboardIcon className="h-4 w-4" />
                Dashboard
                {route === '/' && <TabIndicator />}
              </button>
              <button
                type="button"
                onClick={() => navigate('/notes')}
                aria-current={route === '/notes' ? 'page' : undefined}
                className={tabClassName(route === '/notes')}
              >
                <NotebookTextIcon className="h-4 w-4" />
                Notes
                <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-xs font-semibold leading-5 text-muted-foreground">
                  {notes.length}
                </span>
                {route === '/notes' && <TabIndicator />}
              </button>
            </nav>
          </div>
          <div className="flex justify-center">
            <Button
              id={SEARCH_TRIGGER_ID}
              type="button"
              variant="ghost"
              onClick={(event) => handleOpenSearch(event.currentTarget)}
              className="h-9 w-full max-w-md justify-between gap-2 bg-muted/30 px-3 font-normal text-muted-foreground hover:bg-muted/45 hover:text-foreground focus-visible:bg-muted/45 dark:bg-input/30 dark:hover:bg-input/45 dark:focus-visible:bg-input/45"
              aria-label="Search work"
              aria-keyshortcuts={SEARCH_SHORTCUT.ariaKeyShortcuts}
            >
              <span className="flex min-w-0 items-center gap-2">
                <SearchIcon aria-hidden="true" className="size-4 shrink-0" />
                <span className="truncate">Search work</span>
              </span>
              <span className="flex items-center gap-1" aria-hidden="true">
                {SEARCH_SHORTCUT.keys.map((key) => (
                  <KeyboardShortcutKey key={key}>{key}</KeyboardShortcutKey>
                ))}
              </span>
            </Button>
          </div>
          <div className="flex items-center gap-0.5">
            <AllCommentsWidget />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
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
                        isFetching > 0 && 'motion-safe:animate-spin',
                      )}
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh data</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <KeyboardShortcutsHelp />
            <ModeToggle />
            <AppSettings />
          </div>
        </div>
      </div>
    </header>
  );
}
