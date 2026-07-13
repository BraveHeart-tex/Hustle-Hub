import {
  GitMerge,
  GitPullRequestDraft,
  SearchIcon,
  SquareArrowOutUpRight,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { GitlabIcon } from '@/components/misc/GitlabIcon';
import { JiraIcon } from '@/components/misc/JiraIcon';
import { KeyboardShortcutKey } from '@/components/newtab/KeyboardShortcutKey';
import { SEARCH_SHORTCUT } from '@/components/newtab/keyboardShortcuts';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { useWorkItemSearch } from '@/hooks/useWorkItemSearch';

// Maps Jira status category to a color pill
const STATUS_CATEGORY_CONFIG: Record<string, string> = {
  'To Do': 'bg-muted text-muted-foreground border-border',
  'In Progress': 'bg-info/10 text-info border-info/20',
  Done: 'bg-success/10 text-success border-success/20',
  'On Review': 'bg-info/10 text-info border-info/20',
  'On Hold': 'bg-warning/10 text-warning border-warning/20',
  Testing: 'bg-info/10 text-info border-info/20',
};

export const OPEN_SEARCH_EVENT = 'hustle-hub:open-search';
export const SEARCH_TRIGGER_ID = 'newtab-search-trigger';

export interface OpenSearchEventDetail {
  trigger?: HTMLElement;
}

function getStatusStyle(statusName: string): string {
  return (
    STATUS_CATEGORY_CONFIG[statusName] ??
    'bg-muted text-muted-foreground border-border'
  );
}

function getMergeRequestValue(mr: {
  id: string;
  title: string;
  projectName?: string;
}): string {
  return `${mr.id} ${mr.title} ${mr.projectName ?? ''}`;
}

function getJiraIssueValue(issue: {
  id: string;
  key?: string;
  title: string;
  status?: string;
}): string {
  return `${issue.id} ${issue.key ?? ''} ${issue.title} ${issue.status ?? ''}`;
}

export const SearchDialog = () => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const searchTriggerRef = useRef<HTMLElement | null>(null);
  const { gitlab: filteredMRs, jira: filteredIssues } = useWorkItemSearch(
    query,
    isOpen,
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((open) => {
          if (!open) {
            searchTriggerRef.current =
              document.getElementById(SEARCH_TRIGGER_ID);
          }
          return !open;
        });
      }
    };
    const handleOpenSearch = (event: Event) => {
      const { trigger } =
        (event as CustomEvent<OpenSearchEventDetail>).detail ?? {};
      searchTriggerRef.current =
        trigger ?? document.getElementById(SEARCH_TRIGGER_ID);
      setIsOpen(true);
    };
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener(OPEN_SEARCH_EVENT, handleOpenSearch);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener(OPEN_SEARCH_EVENT, handleOpenSearch);
    };
  }, []);

  const hasResults = filteredMRs.length > 0 || filteredIssues.length > 0;

  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);
    if (!open) setQuery('');
  }, []);

  const handleCloseAutoFocus = useCallback((event: Event) => {
    event.preventDefault();
    searchTriggerRef.current?.focus();
  }, []);

  const handleResultSelect = useCallback(
    (url: string, features?: string) => {
      window.open(url, '_blank', features);
      handleOpenChange(false);
    },
    [handleOpenChange],
  );

  return (
    <CommandDialog
      open={isOpen}
      onOpenChange={handleOpenChange}
      className="lg:min-w-[580px] overflow-hidden"
      showCloseButton={false}
      onCloseAutoFocus={handleCloseAutoFocus}
      commandProps={{ shouldFilter: false }}
    >
      {/* Search input */}
      <CommandInput
        wrapperClassName="h-auto gap-2.5 px-4 py-3 focus-within:border-border focus-within:ring-0"
        iconClassName="size-[15px] text-muted-foreground/60 opacity-100"
        className="h-auto flex-1 p-0 placeholder:text-muted-foreground/40"
        placeholder="Search MRs, tickets…"
        aria-label="Search work"
        value={query}
        onValueChange={setQuery}
        autoFocus
        trailing={
          <span
            className="hidden items-center gap-1 sm:flex"
            aria-hidden="true"
          >
            {SEARCH_SHORTCUT.keys.map((key) => (
              <KeyboardShortcutKey key={key}>{key}</KeyboardShortcutKey>
            ))}
          </span>
        }
      />

      <CommandList className="max-h-[420px] overflow-y-auto py-1.5">
        {!hasResults && (
          <CommandEmpty>
            <div className="flex flex-col items-center gap-1.5 py-8 text-center">
              <SearchIcon size={20} className="text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                {query
                  ? `No results for "${query}"`
                  : 'Start typing to search…'}
              </p>
            </div>
          </CommandEmpty>
        )}

        {/* GitLab MRs */}
        {filteredMRs.length > 0 && (
          <CommandGroup
            heading={
              <div className="flex items-center gap-1.5">
                <GitlabIcon className="h-3 w-3" />
                <span>Merge Requests</span>
                <span className="ml-auto text-[10px] text-muted-foreground/50 font-normal">
                  {filteredMRs.length}
                </span>
              </div>
            }
          >
            {filteredMRs.map((mr) => (
              <CommandItem
                key={mr.id}
                value={getMergeRequestValue(mr)}
                className="group flex items-start gap-3 px-3 py-2.5 cursor-pointer"
                onSelect={() =>
                  handleResultSelect(mr.url, 'noopener,noreferrer')
                }
              >
                {/* MR icon */}
                <div className="mt-0.5 shrink-0">
                  {mr.draft ? (
                    <GitPullRequestDraft
                      size={14}
                      className="text-muted-foreground/50"
                    />
                  ) : (
                    <GitMerge size={14} className="text-info" />
                  )}
                </div>

                {/* Content */}
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="shrink-0 font-mono text-xs text-muted-foreground">
                      {mr.key ?? mr.id}
                    </span>
                    <span className="text-sm font-medium truncate">
                      {mr.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="truncate text-xs text-muted-foreground">
                      {mr.projectName}
                    </span>
                    {mr.draft && (
                      <span className="text-[10px] text-muted-foreground border border-border rounded px-1.5 py-px">
                        Draft
                      </span>
                    )}
                    {(mr.approvedBy ?? 0) > 0 && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-success bg-success/10 border border-success/20 rounded-full px-1.5 py-px">
                        ✓ {mr.approvedBy}/{mr.approvalsRequired ?? 0}
                      </span>
                    )}
                    {mr.conflicts && (
                      <span className="inline-flex items-center text-[10px] font-medium text-destructive bg-destructive/10 border border-destructive/20 rounded-full px-1.5 py-px">
                        Conflicts
                      </span>
                    )}
                  </div>
                </div>

                <SquareArrowOutUpRight
                  size={12}
                  className="shrink-0 mt-1 text-muted-foreground/0 group-data-[selected=true]:text-muted-foreground/40 transition-colors"
                />
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {filteredMRs.length > 0 && filteredIssues.length > 0 && (
          <CommandSeparator className="my-1" />
        )}

        {/* Jira Issues */}
        {filteredIssues.length > 0 && (
          <CommandGroup
            heading={
              <div className="flex items-center gap-1.5">
                <JiraIcon className="h-3 w-3 text-blue-500" />
                <span>Jira Tickets</span>
                <span className="ml-auto text-[10px] text-muted-foreground/50 font-normal">
                  {filteredIssues.length}
                </span>
              </div>
            }
          >
            {filteredIssues.map((issue) => (
              <CommandItem
                key={issue.id}
                value={getJiraIssueValue(issue)}
                className="group flex items-start gap-3 px-3 py-2.5 cursor-pointer"
                onSelect={() => handleResultSelect(issue.url)}
              >
                {/* Priority dot */}
                <div className="mt-1.5 shrink-0 h-1.5 w-1.5 rounded-full bg-info" />

                {/* Content */}
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="shrink-0 font-mono text-xs font-medium text-foreground/70">
                      {issue.key ?? issue.id}
                    </span>
                    {issue.status && (
                      <span
                        className={`inline-flex items-center text-[10px] font-medium border rounded-full px-1.5 py-px shrink-0 ${getStatusStyle(issue.status)}`}
                      >
                        {issue.status}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium truncate mt-0.5">
                    {issue.title}
                  </p>
                </div>

                <SquareArrowOutUpRight
                  size={12}
                  className="shrink-0 mt-1 text-muted-foreground/0 group-data-[selected=true]:text-muted-foreground/40 transition-colors"
                />
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>

      {/* Footer hint */}
      <div className="border-t px-4 py-2 flex items-center gap-3">
        <span className="text-[10px] text-muted-foreground/70 flex items-center gap-1">
          <KeyboardShortcutKey>↵</KeyboardShortcutKey>
          open
        </span>
        <span className="text-[10px] text-muted-foreground/70 flex items-center gap-1">
          <KeyboardShortcutKey>↑↓</KeyboardShortcutKey>
          navigate
        </span>
        <span className="text-[10px] text-muted-foreground/70 flex items-center gap-1">
          <KeyboardShortcutKey>esc</KeyboardShortcutKey>
          close
        </span>
      </div>
    </CommandDialog>
  );
};
