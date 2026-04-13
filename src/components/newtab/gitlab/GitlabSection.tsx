import { AlertCircle, ChevronDown, GitMerge } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

import GitlabIcon from '@/components/misc/GitlabIcon';
import FilterButton from '@/components/newtab/FilterButton';
import MRItem from '@/components/newtab/gitlab/MRItem';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useApproveSyncMrs } from '@/hooks/useApproveSyncMrs';
import { useGitlabMrs } from '@/hooks/useGitlabMrs';
import { GITLAB_FILTERS } from '@/lib/constants';
import { useGitlabFilter } from '@/lib/storage/filters';
import { cn } from '@/lib/utils';
import { isValueOf } from '@/lib/utils/misc/isValueOf';

const filterOptions = [
  { label: 'Review Requested', value: GITLAB_FILTERS.REVIEW },
  { label: 'Assigned to me', value: GITLAB_FILTERS.ASSIGNED },
];

const hasSyncLabel = (labels: { title: string }[]) =>
  labels.some((label) => label.title.trim().toLowerCase() === 'sync');

export default function GitlabSection() {
  const { mutate: approveSyncMrs, isPending: isApprovingSyncMrs } =
    useApproveSyncMrs();
  const [filter, setFilter] = useGitlabFilter();
  const { data, isError, isLoading, error } = useGitlabMrs(filter);
  const [selectedProjectName, setSelectedProjectName] = useState('');
  const [isDraftsOpen, setIsDraftsOpen] = useState(false);
  const [isSyncOpen, setIsSyncOpen] = useState(false);

  const handleFilterValueChange = (value: string) => {
    if (isValueOf(GITLAB_FILTERS, value)) {
      setSelectedProjectName('');
      setFilter(value);
    }
  };

  const avilableProjectNames: string[] = useMemo(() => {
    if (!data) return [];
    return data.reduce<string[]>((acc, curr) => {
      const projectName = curr.projectName;
      if (projectName && !acc.includes(projectName)) {
        acc.push(projectName);
      }
      return acc;
    }, []);
  }, [data]);

  const filteredMrs = useMemo(() => {
    if (!data) return [];

    return selectedProjectName
      ? data.filter((mr) => mr.projectName === selectedProjectName)
      : data;
  }, [data, selectedProjectName]);

  const activeMrs = useMemo(() => {
    const nonDraftMrs = filteredMrs.filter((mr) => !mr.draft);

    if (filter !== GITLAB_FILTERS.REVIEW) {
      return nonDraftMrs;
    }

    return nonDraftMrs.filter((mr) => !hasSyncLabel(mr.labels));
  }, [filter, filteredMrs]);

  const draftMrs = useMemo(
    () => filteredMrs.filter((mr) => mr.draft),
    [filteredMrs],
  );

  const syncMrs = useMemo(() => {
    if (filter !== GITLAB_FILTERS.REVIEW) {
      return [];
    }

    return filteredMrs.filter(
      (mr) =>
        !mr.draft &&
        (hasSyncLabel(mr.labels) || mr.sourceBranch.startsWith('sync/')),
    );
  }, [filter, filteredMrs]);

  const approveAllSyncMrs = useCallback(() => {
    if (syncMrs.length === 0) return;

    const approvalsByProjectId = syncMrs.reduce<Record<string, string[]>>(
      (acc, mr) => {
        acc[mr.projectId] ??= [];
        acc[mr.projectId].push(mr.iid);
        return acc;
      },
      {},
    );

    approveSyncMrs(approvalsByProjectId);
  }, [approveSyncMrs, syncMrs]);

  const renderContent = useCallback(() => {
    if (isLoading) {
      return (
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-4 animate-pulse">
              <CardContent>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (isError) {
      return (
        <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
          <AlertCircle size={22} className="text-destructive/50" />
          <p className="text-sm text-destructive font-medium">
            {error?.message ?? 'Failed to load merge requests.'}
          </p>
        </div>
      );
    }

    if (data?.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
          <GitMerge size={22} className="text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            {filter === GITLAB_FILTERS.REVIEW
              ? 'No review requests waiting for you.'
              : 'No MRs assigned to you.'}
          </p>
        </div>
      );
    }

    return (
      <>
        {activeMrs.map((mr) => (
          <MRItem mr={mr} key={mr.iid} />
        ))}

        {draftMrs.length > 0 && (
          <Collapsible
            open={isDraftsOpen}
            onOpenChange={setIsDraftsOpen}
            className="rounded-xl border border-dashed border-border/80 bg-muted/20"
          >
            <CollapsibleTrigger className="rounded-xl flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-all hover:bg-muted/20 data-[state=open]:rounded-b-none dark:hover:bg-accent/50">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">
                  Draft merge requests
                </p>
                <p className="text-xs text-muted-foreground">
                  {draftMrs.length} hidden by default to keep the list focused
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  {draftMrs.length}
                </span>
                <ChevronDown
                  className={cn(
                    'size-4 text-muted-foreground transition-transform duration-200',
                    isDraftsOpen && 'rotate-180',
                  )}
                />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0">
              <div className="grid gap-3 border-t border-border/60 px-3 py-3">
                {draftMrs.map((mr) => (
                  <MRItem mr={mr} key={mr.iid} />
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
        {syncMrs.length > 0 && (
          <Collapsible
            open={isSyncOpen}
            onOpenChange={setIsSyncOpen}
            className="rounded-xl border border-dashed border-border/80 bg-muted/20"
          >
            <div className="flex items-center gap-2 px-4 py-3">
              {/* Left: text */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">
                  Sync merge requests
                </p>
                <p className="text-xs text-muted-foreground">
                  {syncMrs.length} hidden by default to keep review requests
                  focused
                </p>
              </div>

              {/* Right: actions + trigger */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  className="rounded-md border border-border bg-background px-2 py-1 text-[11px] font-medium text-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    void approveAllSyncMrs();
                  }}
                  disabled={isApprovingSyncMrs}
                >
                  {isApprovingSyncMrs ? 'Approving...' : 'Approve all'}
                </button>

                <CollapsibleTrigger className="flex items-center gap-1.5 rounded-md px-2 py-1 transition-colors hover:bg-muted/20 dark:hover:bg-accent/50">
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                    {syncMrs.length}
                  </span>
                  <ChevronDown
                    className={cn(
                      'size-4 text-muted-foreground transition-transform duration-200',
                      isSyncOpen && 'rotate-180',
                    )}
                  />
                </CollapsibleTrigger>
              </div>
            </div>

            <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0">
              <div className="grid gap-3 border-t border-border/60 px-3 py-3">
                {syncMrs.map((mr) => (
                  <MRItem mr={mr} key={mr.iid} />
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </>
    );
  }, [
    activeMrs,
    draftMrs,
    error?.message,
    isError,
    isDraftsOpen,
    isLoading,
    filter,
    data?.length,
    approveAllSyncMrs,
    isApprovingSyncMrs,
    isSyncOpen,
    syncMrs,
  ]);

  return (
    <Card className="max-h-[calc(100vh-110px)] flex flex-col">
      <CardHeader className="pb-1 shrink-0">
        <CardTitle className="w-full flex items-center justify-between">
          <div className="flex items-center gap-2 text-lg">
            <a
              href="https://gitlab.com/dashboard/merge_requests"
              target="_blank"
              rel="noreferrer noopener"
            >
              <GitlabIcon />
            </a>
            <span>GitLab MRs</span>
          </div>
          <Select
            value={filter}
            onValueChange={handleFilterValueChange}
            defaultValue={filter}
            disabled={isLoading}
          >
            <SelectTrigger size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {filterOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </CardTitle>
        {isLoading && <Skeleton className="h-4 w-1/3" />}
        {!isLoading && avilableProjectNames.length > 1 && (
          <div className="flex items-center gap-2 flex-nowrap whitespace-nowrap overflow-x-auto">
            {avilableProjectNames.map((projectName) => (
              <FilterButton
                key={projectName}
                active={selectedProjectName === projectName}
                onClick={() =>
                  setSelectedProjectName((prev) =>
                    prev === projectName ? '' : projectName,
                  )
                }
              >
                {projectName}
              </FilterButton>
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 grid gap-3 overflow-auto pt-2">
        {renderContent()}
      </CardContent>
    </Card>
  );
}
