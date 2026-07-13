import { AlertCircle, ChevronDown, GitMerge, RefreshCw } from 'lucide-react';
import { useCallback, useMemo, useRef, useState } from 'react';

import { GitlabIcon } from '@/components/misc/GitlabIcon';
import { FilterButton } from '@/components/newtab/FilterButton';
import { MRItem } from '@/components/newtab/gitlab/MRItem';
import { KeyboardShortcutKey } from '@/components/newtab/KeyboardShortcutKey';
import { GITLAB_FILTER_SHORTCUTS } from '@/components/newtab/keyboardShortcuts';
import { useTwoKeyFilterShortcuts } from '@/components/newtab/useTwoKeyFilterShortcuts';
import { Button } from '@/components/ui/button';
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

const hasSyncLabel = (labels: { title: string }[]) =>
  labels.some((label) => label.title.trim().toLowerCase() === 'sync');

const isSyncBranch = (sourceBranch: string): boolean =>
  sourceBranch.startsWith('sync/');

export function GitlabSection() {
  const {
    mutate: approveSyncMrs,
    isPending: isApprovingSyncMrs,
    reset: resetApproval,
  } = useApproveSyncMrs();
  const [filter, setFilter] = useGitlabFilter();
  const {
    data,
    isError,
    isUnauthorized,
    isFetching,
    isLoading,
    error,
    refetch,
  } = useGitlabMrs(filter);
  const [selectedProjectName, setSelectedProjectName] = useState('');
  const [isDraftsOpen, setIsDraftsOpen] = useState(false);
  const [isSyncOpen, setIsSyncOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [approvalFeedback, setApprovalFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const headingRef = useRef<HTMLSpanElement>(null);
  const hasData = data !== undefined;
  const hasProviderError = isError || isUnauthorized;
  const isRefreshing = isFetching && hasData;

  const retryGitlab = useCallback(async () => {
    await refetch();
    headingRef.current?.focus();
  }, [refetch]);

  const handleFilterValueChange = useCallback(
    (value: string) => {
      if (isValueOf(GITLAB_FILTERS, value)) {
        setSelectedProjectName('');
        setFilter(value);
      }
    },
    [setFilter],
  );

  const closeShortcutFilter = useCallback(() => {
    setIsFilterOpen(false);
  }, []);

  const openShortcutFilter = useCallback(() => {
    setIsFilterOpen(true);
  }, []);

  const handleShortcutFilterSelect = useCallback(
    (value: string) => {
      handleFilterValueChange(value);
      setIsFilterOpen(false);
    },
    [handleFilterValueChange],
  );

  useTwoKeyFilterShortcuts({
    disabled: isLoading,
    isOpen: isFilterOpen,
    options: GITLAB_FILTER_SHORTCUTS,
    prefixKey: 'g',
    onCancel: closeShortcutFilter,
    onPrefix: openShortcutFilter,
    onSelect: handleShortcutFilterSelect,
  });

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

    return nonDraftMrs.filter((mr) => {
      return !hasSyncLabel(mr.labels) && !isSyncBranch(mr.sourceBranch);
    });
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
        !mr.draft && (hasSyncLabel(mr.labels) || isSyncBranch(mr.sourceBranch)),
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

    resetApproval();
    setApprovalFeedback(null);
    approveSyncMrs(approvalsByProjectId, {
      onSuccess: () => {
        setApprovalFeedback({
          type: 'success',
          message: `${syncMrs.length} sync merge request${syncMrs.length === 1 ? '' : 's'} approved.`,
        });
      },
      onError: (approvalError) => {
        setApprovalFeedback({
          type: 'error',
          message:
            approvalError instanceof Error
              ? approvalError.message
              : 'Failed to approve sync merge requests.',
        });
      },
    });
  }, [approveSyncMrs, resetApproval, syncMrs]);

  const renderContent = useCallback(() => {
    if (isLoading) {
      return (
        <div className="grid gap-3" aria-hidden="true">
          {[
            'gitlab-loading-primary',
            'gitlab-loading-secondary',
            'gitlab-loading-tertiary',
          ].map((rowId) => (
            <div
              key={rowId}
              className="rounded-lg border border-border px-3 py-2"
            >
              <div className="mb-2 flex items-center gap-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="ml-auto h-3 w-10" />
              </div>
              <Skeleton className="h-4 w-4/5" />
              <div className="mt-2 flex items-center justify-between gap-3">
                <Skeleton className="h-3 w-1/3" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (hasProviderError && !hasData) {
      return (
        <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
          <AlertCircle size={22} className="text-destructive/50" />
          <p className="text-sm text-destructive font-medium">
            {error?.message ?? 'Failed to load merge requests.'}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            loading={isFetching}
            onClick={() => void retryGitlab()}
          >
            <RefreshCw aria-hidden="true" />
            Retry GitLab
          </Button>
        </div>
      );
    }

    if (data?.length === 0) {
      return (
        <div className="flex items-center gap-2 py-2">
          <GitMerge
            aria-hidden="true"
            size={16}
            className="shrink-0 text-muted-foreground/40"
          />
          <p className="text-xs text-muted-foreground">
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
            className="border-t border-border"
          >
            <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-muted/30 dark:hover:bg-accent/50">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">
                  Draft merge requests
                </p>
                <p className="text-xs text-muted-foreground">
                  {draftMrs.length} hidden by default to keep the list focused
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
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
            className="border-t border-border"
          >
            <div className="flex items-center gap-2 px-2 py-2">
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
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    void approveAllSyncMrs();
                  }}
                  loading={isApprovingSyncMrs}
                >
                  Approve all
                </Button>

                <CollapsibleTrigger className="flex items-center gap-1.5 rounded-md px-2 py-1 transition-colors hover:bg-muted/20 dark:hover:bg-accent/50">
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
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
    hasData,
    hasProviderError,
    isDraftsOpen,
    isLoading,
    isFetching,
    filter,
    data?.length,
    approveAllSyncMrs,
    isApprovingSyncMrs,
    isSyncOpen,
    syncMrs,
    retryGitlab,
  ]);

  const hasUrgentMr = activeMrs.some(
    (mr) =>
      mr.needsCurrentUserAction ||
      mr.conflicts ||
      mr.headPipelineStatus === 'FAILED',
  );
  const sectionState = isLoading
    ? 'loading'
    : data?.length === 0
      ? 'empty'
      : hasUrgentMr
        ? 'urgent'
        : 'populated';

  return (
    <Card
      data-section-state={sectionState}
      className="max-h-[calc(100vh-110px)] flex flex-col"
    >
      <CardHeader className="pb-1 shrink-0">
        <CardTitle className="w-full flex items-center justify-between">
          <div className="flex items-center gap-2 text-lg">
            <a
              href="https://gitlab.com/dashboard/merge_requests"
              target="_blank"
              rel="noreferrer noopener"
              aria-label="Open GitLab"
            >
              <GitlabIcon />
            </a>
            <span ref={headingRef} tabIndex={-1} className="outline-none">
              GitLab MRs
            </span>
          </div>
          <Select
            open={isFilterOpen}
            onOpenChange={setIsFilterOpen}
            value={filter}
            onValueChange={handleFilterValueChange}
            defaultValue={filter}
            disabled={isLoading}
          >
            <SelectTrigger
              size="sm"
              aria-label="Filter GitLab merge requests"
              aria-keyshortcuts="G"
            >
              <SelectValue />
              <KeyboardShortcutKey>g</KeyboardShortcutKey>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {GITLAB_FILTER_SHORTCUTS.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    aria-keyshortcuts={option.key.toUpperCase()}
                    shortcut={option.shortcutKeys.map((key) => (
                      <KeyboardShortcutKey key={key}>{key}</KeyboardShortcutKey>
                    ))}
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </CardTitle>
        {isLoading && <Skeleton className="h-4 w-1/3" />}
        <div className="min-h-4">
          {isRefreshing && (
            <p className="text-xs text-muted-foreground" role="status">
              Refreshing GitLab merge requests…
            </p>
          )}
        </div>
        {hasProviderError && hasData && (
          <div className="flex items-center justify-between gap-2 text-xs text-destructive">
            <span>
              Could not refresh GitLab. Showing previously loaded data.
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 shrink-0"
              loading={isFetching}
              onClick={() => void retryGitlab()}
            >
              <RefreshCw aria-hidden="true" />
              Retry
            </Button>
          </div>
        )}
        {approvalFeedback && (
          <p
            role="status"
            aria-live="polite"
            className={cn(
              'text-xs',
              approvalFeedback.type === 'error'
                ? 'text-destructive'
                : 'text-success',
            )}
          >
            {approvalFeedback.message}
          </p>
        )}
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
