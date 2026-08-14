import {
  AlertCircle,
  ChevronDown,
  GitMerge,
  RefreshCw,
  ThumbsUp,
} from 'lucide-react';
import { type ReactNode, useCallback, useMemo, useRef, useState } from 'react';

import { GitlabIcon } from '@/components/misc/GitlabIcon';
import { FilterButton } from '@/components/newtab/FilterButton';
import { MRItem } from '@/components/newtab/gitlab/MRItem';
import { KeyboardShortcutKey } from '@/components/newtab/KeyboardShortcutKey';
import { GITLAB_CATEGORY_SHORTCUTS } from '@/components/newtab/keyboardShortcuts';
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
import { useGitlabMrs } from '@/hooks/useGitlabMrs';
import { GITLAB_CATEGORIES, GITLAB_FILTERS } from '@/lib/constants';
import {
  useGitlabCategory,
  useGitlabGroupOpenState,
} from '@/lib/storage/filters';
import { isNeedsReboundMr } from '@/lib/utils/misc/isNeedsReboundMr';
import { isOwnGitlabMr } from '@/lib/utils/misc/isOwnGitlabMr';
import { isReleaseMr } from '@/lib/utils/misc/isReleaseMr';
import { isValueOf } from '@/lib/utils/misc/isValueOf';
import { type GitlabMergeRequest } from '@/types/gitlab';

const deduplicateMergeRequests = (mergeRequests: GitlabMergeRequest[]) => {
  const mergeRequestsById = new Map<string, GitlabMergeRequest>();

  mergeRequests.forEach((mergeRequest) => {
    mergeRequestsById.set(
      `${mergeRequest.projectId}:${mergeRequest.iid}`,
      mergeRequest,
    );
  });

  return Array.from(mergeRequestsById.values());
};

function MrGroup({
  label,
  mergeRequests,
  icon,
  defaultOpen = false,
  needsReboundCount,
}: {
  label: string;
  mergeRequests: GitlabMergeRequest[];
  icon?: ReactNode;
  defaultOpen?: boolean;
  needsReboundCount?: number;
}) {
  const [openState, setGroupOpen] = useGitlabGroupOpenState();
  const isOpen = openState[label] ?? defaultOpen;

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={(nextOpen) => setGroupOpen(label, nextOpen)}
    >
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="group sticky top-0 z-10 flex w-full items-center gap-1.5 bg-card px-3 py-2 text-xs font-medium text-muted-foreground outline-none motion-safe:transition-colors hover:bg-muted/50 focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/50 dark:hover:bg-accent/50"
        >
          <ChevronDown
            aria-hidden="true"
            className="size-3.5 shrink-0 motion-safe:transition-transform motion-safe:duration-200 group-data-[state=closed]:-rotate-90"
          />
          {icon}
          <span className="uppercase tracking-wide">{label}</span>
          <span aria-hidden="true">·</span>
          <span>{mergeRequests.length}</span>
          {needsReboundCount != null && needsReboundCount > 0 && (
            <span
              aria-label={`${needsReboundCount} need rebound`}
              className="ml-auto inline-flex items-center justify-center rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-semibold leading-none text-destructive-foreground"
            >
              {needsReboundCount}
            </span>
          )}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="divide-y divide-border/60 overflow-hidden border-t border-border/60 motion-safe:data-[state=closed]:animate-out motion-safe:data-[state=closed]:fade-out-0 motion-safe:data-[state=open]:animate-in motion-safe:data-[state=open]:fade-in-0">
        {mergeRequests.map((mergeRequest) => (
          <MRItem
            mr={mergeRequest}
            key={`${mergeRequest.projectId}:${mergeRequest.iid}`}
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

export function GitlabSection() {
  const reviewQuery = useGitlabMrs(GITLAB_FILTERS.REVIEW);
  const assignedQuery = useGitlabMrs(GITLAB_FILTERS.ASSIGNED);
  const [category, setCategory] = useGitlabCategory();
  const [selectedProjectName, setSelectedProjectName] = useState('');
  const [isCategorySelectOpen, setIsCategorySelectOpen] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const reviewRequestedMrs = useMemo(
    () =>
      (reviewQuery.data ?? []).filter((mergeRequest) => !mergeRequest.draft),
    [reviewQuery.data],
  );
  const assignedMrs = useMemo(
    () =>
      (assignedQuery.data ?? []).filter((mergeRequest) => !mergeRequest.draft),
    [assignedQuery.data],
  );
  const draftMrs = useMemo(
    () =>
      deduplicateMergeRequests([
        ...(reviewQuery.data ?? []),
        ...(assignedQuery.data ?? []),
      ]).filter((mergeRequest) => mergeRequest.draft),
    [assignedQuery.data, reviewQuery.data],
  );

  let categoryMrs = reviewRequestedMrs;
  if (category === GITLAB_CATEGORIES.ASSIGNED_TO_ME) {
    categoryMrs = assignedMrs;
  } else if (category === GITLAB_CATEGORIES.DRAFTS) {
    categoryMrs = draftMrs;
  }
  const filteredMrs = selectedProjectName
    ? categoryMrs.filter(
        (mergeRequest) => mergeRequest.projectName === selectedProjectName,
      )
    : categoryMrs;
  const availableProjectNames = useMemo(
    () =>
      Array.from(
        new Set(
          categoryMrs
            .map((mergeRequest) => mergeRequest.projectName)
            .filter(Boolean),
        ),
      ),
    [categoryMrs],
  );

  const isDraftCategory = category === GITLAB_CATEGORIES.DRAFTS;
  const isAssignedCategory = category === GITLAB_CATEGORIES.ASSIGNED_TO_ME;
  const isReviewRequestedCategory = !isDraftCategory && !isAssignedCategory;

  const approvedByYouMrs = isReviewRequestedCategory
    ? filteredMrs.filter((mergeRequest) => mergeRequest.approvedByCurrentUser)
    : [];
  const visibleMrs = isReviewRequestedCategory
    ? filteredMrs.filter((mergeRequest) => !mergeRequest.approvedByCurrentUser)
    : filteredMrs;

  let activeQueries = [reviewQuery];
  if (isAssignedCategory) {
    activeQueries = [assignedQuery];
  } else if (isDraftCategory) {
    activeQueries = [reviewQuery, assignedQuery];
  }

  const hasData = activeQueries.some((query) => query.data !== undefined);
  const isLoading = activeQueries.some((query) => query.isLoading);
  const isFetching = activeQueries.some((query) => query.isFetching);
  const hasProviderError = activeQueries.some(
    (query) => query.isError || query.isUnauthorized,
  );
  const error = activeQueries.find((query) => query.error)?.error;
  const isRefreshing = isFetching && hasData;

  const retryGitlab = useCallback(async () => {
    if (category === GITLAB_CATEGORIES.ASSIGNED_TO_ME) {
      await assignedQuery.refetch();
    } else if (category === GITLAB_CATEGORIES.DRAFTS) {
      await Promise.all([reviewQuery.refetch(), assignedQuery.refetch()]);
    } else {
      await reviewQuery.refetch();
    }

    headingRef.current?.focus();
  }, [assignedQuery, category, reviewQuery]);

  const handleCategoryChange = useCallback(
    (value: string) => {
      if (!isValueOf(GITLAB_CATEGORIES, value)) return;

      setSelectedProjectName('');
      setCategory(value);
    },
    [setCategory],
  );

  const closeShortcutFilter = useCallback(() => {
    setIsCategorySelectOpen(false);
  }, []);

  const openShortcutFilter = useCallback(() => {
    setIsCategorySelectOpen(true);
  }, []);

  const handleShortcutFilterSelect = useCallback(
    (value: string) => {
      handleCategoryChange(value);
      setIsCategorySelectOpen(false);
    },
    [handleCategoryChange],
  );

  useTwoKeyFilterShortcuts({
    disabled: isLoading,
    isOpen: isCategorySelectOpen,
    options: GITLAB_CATEGORY_SHORTCUTS,
    prefixKey: 'g',
    onCancel: closeShortcutFilter,
    onPrefix: openShortcutFilter,
    onSelect: handleShortcutFilterSelect,
  });

  let categoryNoun = 'review requests';
  if (isAssignedCategory) {
    categoryNoun = 'merge requests assigned to you';
  } else if (isDraftCategory) {
    categoryNoun = 'draft merge requests';
  }

  let emptyMessage = 'No review requests waiting for you.';
  if (selectedProjectName) {
    emptyMessage = `No ${categoryNoun} in ${selectedProjectName}.`;
  } else if (isAssignedCategory) {
    emptyMessage = 'No merge requests assigned to you.';
  } else if (isDraftCategory) {
    emptyMessage = 'No draft merge requests.';
  }

  const getCategoryCount = (value: string) => {
    if (value === GITLAB_CATEGORIES.ASSIGNED_TO_ME) return assignedMrs.length;
    if (value === GITLAB_CATEGORIES.DRAFTS) return draftMrs.length;
    return reviewRequestedMrs.length;
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="divide-y divide-border/60" aria-hidden="true">
          {[
            'gitlab-loading-primary',
            'gitlab-loading-secondary',
            'gitlab-loading-tertiary',
          ].map((rowId) => (
            <div key={rowId} className="px-3 py-3">
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
          <p className="text-sm font-medium text-destructive">
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

    if (visibleMrs.length === 0) {
      return (
        <div className="flex items-center gap-2 py-2">
          <GitMerge
            aria-hidden="true"
            size={16}
            className="shrink-0 text-muted-foreground/40"
          />
          <p className="text-xs text-muted-foreground">{emptyMessage}</p>
        </div>
      );
    }

    const releaseMrs = visibleMrs
      .filter(isReleaseMr)
      .toSorted(
        (a, b) => Number(isNeedsReboundMr(b)) - Number(isNeedsReboundMr(a)),
      );
    const regularMrs = visibleMrs.filter(
      (mergeRequest) => !isReleaseMr(mergeRequest),
    );
    const needsReboundCount = releaseMrs.filter(isNeedsReboundMr).length;

    return (
      <>
        {releaseMrs.length > 0 && (
          <MrGroup
            label="Releases"
            mergeRequests={releaseMrs}
            defaultOpen
            needsReboundCount={needsReboundCount}
          />
        )}
        {regularMrs.length > 0 && (
          <MrGroup
            label="Merge requests"
            mergeRequests={regularMrs}
            defaultOpen
          />
        )}
      </>
    );
  };

  const hasUrgentMr = visibleMrs.some(
    (mergeRequest) =>
      mergeRequest.needsCurrentUserAction ||
      mergeRequest.conflicts ||
      (mergeRequest.needsRebase &&
        isOwnGitlabMr(
          mergeRequest.author.id,
          import.meta.env.VITE_GITLAB_USER_ID,
        )) ||
      mergeRequest.headPipelineStatus === 'FAILED',
  );
  const sectionState = isLoading
    ? 'loading'
    : visibleMrs.length === 0
      ? 'empty'
      : hasUrgentMr
        ? 'urgent'
        : 'populated';

  return (
    <Card
      data-section-state={sectionState}
      className="flex max-h-[calc(100vh-110px)] flex-col"
    >
      <CardHeader className="shrink-0 pb-1">
        <CardTitle className="flex w-full flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-lg">
            <a
              href="https://gitlab.com/dashboard/merge_requests"
              target="_blank"
              rel="noreferrer noopener"
              aria-label="Open GitLab"
            >
              <GitlabIcon />
            </a>
            <h2 ref={headingRef} tabIndex={-1} className="outline-none">
              GitLab MRs
            </h2>
          </div>
          <Select
            open={isCategorySelectOpen}
            onOpenChange={setIsCategorySelectOpen}
            value={category}
            onValueChange={handleCategoryChange}
            disabled={isLoading}
          >
            <SelectTrigger
              size="sm"
              className="max-w-full"
              aria-label="Choose GitLab merge request category"
              aria-keyshortcuts="G"
            >
              <SelectValue />
              <KeyboardShortcutKey>g</KeyboardShortcutKey>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {GITLAB_CATEGORY_SHORTCUTS.map((option) => {
                  const count = getCategoryCount(option.value);

                  return (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      aria-keyshortcuts={option.key.toUpperCase()}
                      shortcut={option.shortcutKeys.map((key) => (
                        <KeyboardShortcutKey key={key}>
                          {key}
                        </KeyboardShortcutKey>
                      ))}
                    >
                      {option.label} ({count})
                    </SelectItem>
                  );
                })}
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
        {!isLoading && availableProjectNames.length > 1 && (
          <div className="flex flex-nowrap items-center gap-2 overflow-x-auto whitespace-nowrap">
            {availableProjectNames.map((projectName) => (
              <FilterButton
                key={projectName}
                active={selectedProjectName === projectName}
                onClick={() =>
                  setSelectedProjectName((currentProjectName) =>
                    currentProjectName === projectName ? '' : projectName,
                  )
                }
              >
                {projectName}
              </FilterButton>
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 divide-y divide-border/60 overflow-auto">
        {renderContent()}
        {approvedByYouMrs.length > 0 && (
          <MrGroup
            label="Approved by you"
            mergeRequests={approvedByYouMrs}
            icon={<ThumbsUp aria-hidden="true" className="size-3" />}
          />
        )}
      </CardContent>
    </Card>
  );
}
