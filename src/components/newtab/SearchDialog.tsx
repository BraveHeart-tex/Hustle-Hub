import { useQueryClient } from '@tanstack/react-query';
import {
  GitMerge,
  GitPullRequestDraft,
  SearchIcon,
  SquareArrowOutUpRight,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import GitlabIcon from '@/components/misc/GitlabIcon';
import JiraIcon from '@/components/misc/JiraIcon';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { QUERY_KEYS } from '@/lib/constants';
import { getJiraTaskUrl } from '@/lib/utils/misc/getJiraTaskUrl';
import { type GitlabMergeRequest } from '@/types/gitlab';
import { type JiraIssue } from '@/types/jira';

interface GroupedData {
  gitlab: GitlabMergeRequest[];
  jira: JiraIssue[];
}

const getGroupedData = (
  queryClient: ReturnType<typeof useQueryClient>,
): GroupedData => {
  const groupedData: GroupedData = { gitlab: [], jira: [] };

  const getSafeQueryData = <T,>(
    key: readonly unknown[],
    fallback: Partial<T>,
  ): T => queryClient.getQueryData<T>(key) ?? (fallback as T);

  const gitlabMap = new Map<string, GitlabMergeRequest>();
  (['assigned', 'review'] as const).forEach((key) => {
    const data = getSafeQueryData<GitlabMergeRequest[]>(
      QUERY_KEYS.gitlab.mergeRequests(key),
      [],
    );
    data.forEach((mr) => gitlabMap.set(String(mr.iid), mr));
  });
  groupedData.gitlab = Array.from(gitlabMap.values());

  const jiraMap = new Map<string, JiraIssue>();
  (['for_you', 'literally_working_on', 'frontend_releases'] as const).forEach(
    (key) => {
      const data = getSafeQueryData<{ issues: JiraIssue[] }>(
        QUERY_KEYS.jira.issues(key),
        { issues: [] },
      );
      data.issues.forEach((issue) => jiraMap.set(issue.key, issue));
    },
  );
  groupedData.jira = Array.from(jiraMap.values());

  return groupedData;
};

// Maps Jira status category to a color pill
const STATUS_CATEGORY_CONFIG: Record<string, string> = {
  'To Do': 'bg-muted text-muted-foreground border-border',
  'In Progress': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  Done: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  'On Review': 'bg-violet-500/10 text-violet-500 border-violet-500/20',
  'On Hold': 'bg-amber-400/10 text-amber-400 border-amber-400/20',
  Testing: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
};

function getStatusStyle(statusName: string): string {
  return (
    STATUS_CATEGORY_CONFIG[statusName] ??
    'bg-muted text-muted-foreground border-border'
  );
}

const SearchDialog = () => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((v) => !v);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const data = useMemo(() => getGroupedData(queryClient), [queryClient]);

  const queryLower = query.toLowerCase();

  const filteredMRs = useMemo(
    () =>
      data.gitlab.filter(
        (mr) =>
          mr.title.toLowerCase().includes(queryLower) ||
          String(mr.iid).includes(queryLower),
      ),
    [data.gitlab, queryLower],
  );

  const filteredIssues = useMemo(
    () =>
      data.jira.filter(
        (issue) =>
          issue.fields.summary.toLowerCase().includes(queryLower) ||
          issue.key.toLowerCase().includes(queryLower),
      ),
    [data.jira, queryLower],
  );

  const hasResults = filteredMRs.length > 0 || filteredIssues.length > 0;

  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);
    if (!open) setQuery('');
  }, []);

  return (
    <CommandDialog
      open={isOpen}
      onOpenChange={handleOpenChange}
      className="lg:min-w-[580px] overflow-hidden"
      showCloseButton={false}
    >
      {/* Search input */}
      <div className="flex items-center gap-2.5 border-b px-4 py-3">
        <SearchIcon size={15} className="shrink-0 text-muted-foreground/60" />
        <input
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/40"
          placeholder="Search MRs, tickets…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
        <kbd className="hidden sm:inline-flex h-5 items-center gap-0.5 rounded border border-border bg-muted px-1.5 text-[10px] font-medium text-muted-foreground/60">
          <span className="text-[11px]">⌘</span>K
        </kbd>
      </div>

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
                key={mr.iid}
                value={`${mr.iid} ${mr.title}`}
                className="group flex items-start gap-3 px-3 py-2.5 cursor-pointer"
                onSelect={() =>
                  window.open(mr.webUrl, '_blank', 'noopener,noreferrer')
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
                    <GitMerge size={14} className="text-emerald-500/80" />
                  )}
                </div>

                {/* Content */}
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-muted-foreground shrink-0">
                      !{mr.iid}
                    </span>
                    <span className="text-sm font-medium truncate">
                      {mr.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] text-muted-foreground truncate">
                      {mr.projectName}
                    </span>
                    {mr.draft && (
                      <span className="text-[10px] text-muted-foreground border border-border rounded px-1.5 py-px">
                        Draft
                      </span>
                    )}
                    {mr.approvedBy > 0 && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-1.5 py-px">
                        ✓ {mr.approvedBy}/{mr.approvalsRequired}
                      </span>
                    )}
                    {mr.conflicts && (
                      <span className="inline-flex items-center text-[10px] font-medium text-red-500 bg-red-500/10 border border-red-500/20 rounded-full px-1.5 py-px">
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
                key={issue.key}
                value={`${issue.key} ${issue.fields.summary}`}
                className="group flex items-start gap-3 px-3 py-2.5 cursor-pointer"
                onSelect={() =>
                  window.open(getJiraTaskUrl(issue.key), '_blank')
                }
              >
                {/* Priority dot */}
                <div className="mt-1.5 shrink-0 h-1.5 w-1.5 rounded-full bg-blue-400/60" />

                {/* Content */}
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-mono font-medium text-foreground/70 shrink-0">
                      {issue.key}
                    </span>
                    <span
                      className={`inline-flex items-center text-[10px] font-medium border rounded-full px-1.5 py-px shrink-0 ${getStatusStyle(issue.fields.status.name)}`}
                    >
                      {issue.fields.status.name}
                    </span>
                  </div>
                  <p className="text-sm font-medium truncate mt-0.5">
                    {issue.fields.summary}
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
          <kbd className="inline-flex h-4 items-center rounded border border-border bg-muted px-1 text-[10px]">
            ↵
          </kbd>
          open
        </span>
        <span className="text-[10px] text-muted-foreground/70 flex items-center gap-1">
          <kbd className="inline-flex h-4 items-center rounded border border-border bg-muted px-1 text-[10px]">
            ↑↓
          </kbd>
          navigate
        </span>
        <span className="text-[10px] text-muted-foreground/70 flex items-center gap-1">
          <kbd className="inline-flex h-4 items-center rounded border border-border bg-muted px-1 text-[10px]">
            esc
          </kbd>
          close
        </span>
      </div>
    </CommandDialog>
  );
};

export default SearchDialog;
