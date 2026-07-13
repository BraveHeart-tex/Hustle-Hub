import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  BellOff,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  Clock,
  GitMerge,
  MessageSquare,
  RefreshCw,
  Ticket,
  Zap,
} from 'lucide-react';
import { useCallback, useId, useMemo, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Skeleton } from '@/components/ui/skeleton';
import { useAttention } from '@/hooks/useAttention';
import { QUERY_KEYS } from '@/lib/constants';
import { ENDPOINTS } from '@/lib/endpoints';
import { isMockDataEnabled } from '@/lib/mockData';
import { cn } from '@/lib/utils';
import type { AttentionItem, AttentionPriority } from '@/types/attention';

// ------------------------------------------------------------
// Priority config
// ------------------------------------------------------------

const PRIORITY_CONFIG: Record<
  AttentionPriority,
  { bar: string; badge: string; icon: string; dot: string }
> = {
  critical: {
    bar: 'bg-red-500',
    badge: 'bg-red-500/10 text-red-500 border-red-500/20',
    dot: 'bg-red-500 shadow-[0_0_6px_1px_rgba(239,68,68,0.6)] animate-pulse',
    icon: 'text-red-500',
  },
  warning: {
    bar: 'bg-amber-400',
    badge: 'bg-amber-400/10 text-amber-400 border-amber-400/20',
    dot: 'bg-amber-400',
    icon: 'text-amber-400',
  },
  info: {
    bar: 'bg-blue-400',
    badge: 'bg-blue-400/10 text-blue-400 border-blue-400/20',
    dot: 'bg-blue-400/60',
    icon: 'text-blue-400',
  },
};

// ------------------------------------------------------------
// Snooze options
// ------------------------------------------------------------

const SNOOZE_OPTIONS = [
  { label: '30m', value: '30m' as const },
  { label: '1h', value: '1h' as const },
  { label: '2h', value: '2h' as const },
  { label: '4h', value: '4h' as const },
  { label: '24h', value: '24h' as const },
];

// ------------------------------------------------------------
// Source icon
// ------------------------------------------------------------

function SourceIcon({ item }: { item: AttentionItem }) {
  const cfg = PRIORITY_CONFIG[item.priority];
  if (item.source === 'gitlab') {
    return <GitMerge size={13} className={cfg.icon} />;
  }
  if (item.ruleId.includes('reply')) {
    return <MessageSquare size={13} className={cfg.icon} />;
  }
  return <Ticket size={13} className={cfg.icon} />;
}

interface AttentionEntityGroup {
  key: string;
  entityId: string;
  entityUrl: string;
  entityTitle: string;
  source: AttentionItem['source'];
  priority: AttentionPriority;
  items: AttentionItem[];
}

function groupAttentionItems(items: AttentionItem[]): AttentionEntityGroup[] {
  const groups = new Map<string, AttentionEntityGroup>();

  for (const item of items) {
    const key = `${item.source}:${item.entityId}`;
    const existing = groups.get(key);

    if (existing) {
      existing.items.push(item);
      continue;
    }

    groups.set(key, {
      key,
      entityId: item.entityId,
      entityUrl: item.entityUrl,
      entityTitle: item.entityTitle,
      source: item.source,
      priority: item.priority,
      items: [item],
    });
  }

  return Array.from(groups.values());
}

// ------------------------------------------------------------
// Single attention item row
// ------------------------------------------------------------

function AttentionRow({
  item,
  onDismiss,
  onSnooze,
  pendingAction,
  nested = false,
}: {
  item: AttentionItem;
  onDismiss: (id: string) => Promise<boolean>;
  onSnooze: (id: string, duration: string) => Promise<boolean>;
  pendingAction?: string;
  nested?: boolean;
}) {
  const [showSnooze, setShowSnooze] = useState(false);
  const snoozeOptionsId = useId();
  const cfg = PRIORITY_CONFIG[item.priority];

  return (
    <div
      className={cn(
        'group relative flex items-start gap-3 rounded-lg transition-colors hover:bg-muted/40',
        nested ? 'border border-border/50 px-2.5 py-2' : 'px-3 py-2.5',
      )}
    >
      {!nested && (
        <>
          <div
            className={`absolute left-0 top-2 bottom-2 w-[3px] rounded-full ${cfg.bar}`}
          />
          <div className="mt-[5px] shrink-0">
            <span className={`block h-2 w-2 rounded-full ${cfg.dot}`} />
          </div>
        </>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <a
            href={item.entityUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="flex items-center gap-1.5 rounded text-sm font-medium leading-snug hover:underline underline-offset-2 truncate outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px]"
          >
            <SourceIcon item={item} />
            <span className="truncate">{item.title}</span>
            <ChevronRight
              size={11}
              className="shrink-0 text-muted-foreground/50"
            />
          </a>

          <div
            className={`flex items-center gap-1 shrink-0 transition-opacity ${showSnooze ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100'}`}
          >
            <Button
              type="button"
              onClick={() => setShowSnooze((v) => !v)}
              variant="ghost"
              size="icon"
              className="size-6 text-muted-foreground"
              disabled={pendingAction !== undefined}
              aria-label={`Snooze ${item.title}`}
              aria-expanded={showSnooze}
              aria-controls={snoozeOptionsId}
              title="Snooze"
            >
              <Clock aria-hidden="true" size={12} />
            </Button>
            <Button
              type="button"
              onClick={() => void onDismiss(item.id)}
              variant="ghost"
              size="icon"
              className="size-6 text-muted-foreground"
              loading={pendingAction === 'dismiss'}
              disabled={pendingAction !== undefined}
              aria-label={`Dismiss ${item.title}`}
              title="Dismiss"
            >
              <CheckCheck aria-hidden="true" size={12} />
            </Button>
          </div>
        </div>

        {!nested && item.entityTitle && (
          <p className="mt-0.5 text-xs text-muted-foreground/70 leading-snug truncate font-normal">
            {item.entityTitle}
          </p>
        )}

        {item.body && (
          <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed truncate">
            {item.body}
          </p>
        )}

        {showSnooze && (
          <div
            id={snoozeOptionsId}
            className="mt-2 flex items-center gap-1.5 flex-wrap"
          >
            <span className="text-xs text-muted-foreground">Snooze for:</span>
            {SNOOZE_OPTIONS.map((opt) => (
              <Button
                type="button"
                key={opt.value}
                variant="outline"
                size="sm"
                className="h-6 px-2 text-xs text-muted-foreground"
                loading={pendingAction === `snooze:${opt.value}`}
                disabled={pendingAction !== undefined}
                onClick={async () => {
                  const succeeded = await onSnooze(item.id, opt.value);
                  if (succeeded) setShowSnooze(false);
                }}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AttentionEntityRow({
  group,
  onDismiss,
  onSnooze,
  pendingActions,
}: {
  group: AttentionEntityGroup;
  onDismiss: (id: string) => Promise<boolean>;
  onSnooze: (id: string, duration: string) => Promise<boolean>;
  pendingActions: Record<string, string>;
}) {
  const [open, setOpen] = useState(false);
  const contentId = useId();
  const representativeItem = group.items[0];

  if (group.items.length === 1) {
    return (
      <AttentionRow
        item={representativeItem}
        onDismiss={onDismiss}
        onSnooze={onSnooze}
        pendingAction={pendingActions[representativeItem.id]}
      />
    );
  }

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="border border-border/70 bg-muted/15"
    >
      <div className="relative px-3 py-3 transition-colors hover:bg-muted/30">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            aria-label={`${open ? 'Collapse' : 'Expand'} ${group.entityTitle || representativeItem.title}`}
            aria-controls={contentId}
            className="absolute inset-0 w-full outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px]"
          />
        </CollapsibleTrigger>
        <div className="pointer-events-none relative flex w-full items-start justify-between gap-3 text-left">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-sm font-medium leading-snug">
              <SourceIcon item={representativeItem} />
              <a
                href={group.entityUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="pointer-events-auto relative z-10 rounded truncate hover:underline underline-offset-2 outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                onClick={(event) => event.stopPropagation()}
              >
                {group.entityTitle || representativeItem.title}
              </a>
              <ChevronRight
                size={11}
                className="shrink-0 text-muted-foreground/50"
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {group.items.length} attention items for the same entity
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="rounded-full border border-border bg-background/70 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              {group.items.length}
            </span>
            <ChevronDown
              className={cn(
                'size-4 text-muted-foreground transition-transform duration-200',
                open && 'rotate-180',
              )}
            />
          </div>
        </div>
      </div>
      <CollapsibleContent
        id={contentId}
        className="overflow-hidden data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0"
      >
        <div className="grid gap-2 border-t border-border/60 px-3 py-3">
          {group.items.map((item) => (
            <AttentionRow
              key={item.id}
              item={item}
              onDismiss={onDismiss}
              onSnooze={onSnooze}
              pendingAction={pendingActions[item.id]}
              nested
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// ------------------------------------------------------------
// Priority group header
// ------------------------------------------------------------

function PriorityGroup({
  priority,
  groups,
  onDismiss,
  onSnooze,
  pendingActions,
}: {
  priority: AttentionPriority;
  groups: AttentionEntityGroup[];
  onDismiss: (id: string) => Promise<boolean>;
  onSnooze: (id: string, duration: string) => Promise<boolean>;
  pendingActions: Record<string, string>;
}) {
  if (groups.length === 0) return null;
  const cfg = PRIORITY_CONFIG[priority];
  const label = { critical: 'Needs action', warning: 'Heads up', info: 'FYI' }[
    priority
  ];
  const itemCount = groups.reduce(
    (count, group) => count + group.items.length,
    0,
  );

  return (
    <div>
      <div className="flex items-center gap-2 px-3 mb-1">
        <span
          className={`text-[10px] font-semibold uppercase tracking-widest ${cfg.icon}`}
        >
          {label}
        </span>
        <span
          className={`text-[10px] rounded-full border px-1.5 py-px font-medium ${cfg.badge}`}
        >
          {itemCount}
        </span>
      </div>
      <div className="flex flex-col gap-px">
        {groups.map((group) => (
          <AttentionEntityRow
            key={group.key}
            group={group}
            onDismiss={onDismiss}
            onSnooze={onSnooze}
            pendingActions={pendingActions}
          />
        ))}
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// Loading skeleton
// ------------------------------------------------------------

function AttentionSkeleton() {
  return (
    <div className="flex flex-col gap-3 px-1">
      {[...Array(3)].map((_, i: number) => (
        <div key={i} className="flex items-start gap-3 px-3">
          <Skeleton className="mt-1 h-2 w-2 rounded-full shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ------------------------------------------------------------
// Main section
// ------------------------------------------------------------

export function AttentionSection() {
  const queryClient = useQueryClient();
  const {
    data: items,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useAttention();
  const [pendingActions, setPendingActions] = useState<Record<string, string>>(
    {},
  );
  const [isBulkDismissing, setIsBulkDismissing] = useState(false);
  const [mutationFeedback, setMutationFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const headingRef = useRef<HTMLSpanElement>(null);
  const hasData = items !== undefined;
  const isRefreshing = isFetching && hasData;
  const { mutateAsync: runAttentionMutation } = useMutation({
    mutationFn: async ({
      id,
      action,
      duration,
    }: {
      id: string;
      action: 'dismiss' | 'snooze';
      duration?: string;
    }) => {
      if (isMockDataEnabled) return;

      const response = await fetch(
        action === 'dismiss'
          ? ENDPOINTS.attention.dismiss(id)
          : ENDPOINTS.attention.snooze(id),
        {
          method: 'PATCH',
          headers:
            action === 'snooze'
              ? { 'Content-Type': 'application/json' }
              : undefined,
          body: action === 'snooze' ? JSON.stringify({ duration }) : undefined,
        },
      );

      if (!response.ok) {
        throw new Error(
          action === 'dismiss'
            ? 'Could not dismiss the attention item.'
            : 'Could not snooze the attention item.',
        );
      }
    },
  });

  const criticalItems = useMemo(
    () => (items ? items?.filter((item) => item.priority === 'critical') : []),
    [items],
  );
  const warningItems = useMemo(
    () => (items ? items?.filter((item) => item.priority === 'warning') : []),
    [items],
  );
  const infoItems = useMemo(
    () => (items ? items?.filter((item) => item.priority === 'info') : []),
    [items],
  );
  const criticalGroups = useMemo(
    () => groupAttentionItems(criticalItems),
    [criticalItems],
  );
  const warningGroups = useMemo(
    () => groupAttentionItems(warningItems),
    [warningItems],
  );
  const infoGroups = useMemo(() => groupAttentionItems(infoItems), [infoItems]);
  const totalCount = items?.length || 0;

  const retryAttention = useCallback(async () => {
    await refetch();
    headingRef.current?.focus();
  }, [refetch]);

  const mutateAttentionItem = useCallback(
    async (
      id: string,
      action: 'dismiss' | 'snooze',
      duration?: string,
      announce = true,
    ): Promise<boolean> => {
      const pendingAction =
        action === 'snooze' ? `snooze:${duration}` : 'dismiss';
      setPendingActions((current) => ({ ...current, [id]: pendingAction }));
      if (announce) setMutationFeedback(null);

      try {
        await runAttentionMutation({ id, action, duration });

        queryClient.setQueryData<AttentionItem[]>(
          QUERY_KEYS.attention.list,
          (current = []) => current.filter((item) => item.id !== id),
        );
        if (announce) {
          setMutationFeedback({
            type: 'success',
            message:
              action === 'dismiss'
                ? 'Attention item dismissed.'
                : 'Attention item snoozed.',
          });
        }
        return true;
      } catch (mutationError) {
        if (announce) {
          setMutationFeedback({
            type: 'error',
            message: `${
              mutationError instanceof Error
                ? mutationError.message
                : 'Could not update the attention item.'
            } It remains in the list.`,
          });
        }
        return false;
      } finally {
        setPendingActions((current) => {
          const next = { ...current };
          delete next[id];
          return next;
        });
      }
    },
    [queryClient, runAttentionMutation],
  );

  const handleDismiss = useCallback(
    (id: string) => mutateAttentionItem(id, 'dismiss'),
    [mutateAttentionItem],
  );

  const handleSnooze = useCallback(
    (id: string, duration: string) =>
      mutateAttentionItem(id, 'snooze', duration),
    [mutateAttentionItem],
  );

  const handleBulkDismiss = useCallback(async () => {
    if (isBulkDismissing) return;
    setIsBulkDismissing(true);
    setMutationFeedback(null);

    const results = await Promise.all(
      infoItems.map((item) =>
        mutateAttentionItem(item.id, 'dismiss', undefined, false),
      ),
    );
    const successCount = results.filter(Boolean).length;
    const failureCount = results.length - successCount;

    setMutationFeedback({
      type: failureCount > 0 ? 'error' : 'success',
      message:
        failureCount > 0
          ? `Dismissed ${successCount} FYI${successCount === 1 ? '' : 's'}; ${failureCount} failed and remain in the list.`
          : `Dismissed ${successCount} FYI${successCount === 1 ? '' : 's'}.`,
    });
    setIsBulkDismissing(false);
    headingRef.current?.focus();
  }, [infoItems, isBulkDismissing, mutateAttentionItem]);

  const renderContent = useCallback(() => {
    if (isLoading) return <AttentionSkeleton />;

    if (isError && !hasData) {
      return (
        <div className="flex flex-col items-center gap-2 px-3 py-8 text-center">
          <p className="text-sm text-destructive font-medium">
            Failed to load attention feed.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            loading={isFetching}
            onClick={() => void retryAttention()}
          >
            <RefreshCw aria-hidden="true" />
            Retry Attention
          </Button>
        </div>
      );
    }

    if (totalCount === 0) {
      return (
        <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
          <BellOff size={22} className="text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            No attention rules are currently triggered.
          </p>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-3">
        <PriorityGroup
          priority="critical"
          groups={criticalGroups}
          onDismiss={handleDismiss}
          onSnooze={handleSnooze}
          pendingActions={pendingActions}
        />
        <PriorityGroup
          priority="warning"
          groups={warningGroups}
          onDismiss={handleDismiss}
          onSnooze={handleSnooze}
          pendingActions={pendingActions}
        />
        <PriorityGroup
          priority="info"
          groups={infoGroups}
          onDismiss={handleDismiss}
          onSnooze={handleSnooze}
          pendingActions={pendingActions}
        />
      </div>
    );
  }, [
    isLoading,
    isError,
    totalCount,
    criticalGroups,
    warningGroups,
    infoGroups,
    handleDismiss,
    handleSnooze,
    hasData,
    isFetching,
    pendingActions,
    retryAttention,
  ]);

  return (
    <Card className="max-h-[calc(100vh-110px)] flex flex-col">
      <CardHeader className="pb-2 shrink-0">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            {criticalItems.length > 0 ? (
              <Zap size={16} className="text-red-500" />
            ) : (
              <Bell size={16} className="text-muted-foreground" />
            )}
            <span ref={headingRef} tabIndex={-1} className="outline-none">
              Attention
            </span>
            {totalCount > 0 && (
              <span
                className={`
                text-xs rounded-full px-2 py-px font-medium border
                ${
                  criticalItems.length > 0
                    ? 'bg-red-500/10 text-red-500 border-red-500/20'
                    : 'bg-muted text-muted-foreground border-border'
                }
              `}
              >
                {totalCount}
              </span>
            )}
          </div>

          {/* Dismiss all info items shortcut */}
          {infoItems.length > 1 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1"
              onClick={() => void handleBulkDismiss()}
              loading={isBulkDismissing}
            >
              <CheckCheck size={12} />
              Clear FYIs
            </Button>
          )}
        </CardTitle>

        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] text-muted-foreground" role="status">
            {isLoading
              ? 'Loading attention rules…'
              : isRefreshing
                ? 'Refreshing attention rules…'
                : isError
                  ? hasData
                    ? 'Refresh failed. Showing previously loaded rules.'
                    : 'Attention rules are unavailable.'
                  : isMockDataEnabled
                    ? 'Showing local mock attention rules.'
                    : 'Attention rules are up to date.'}
          </p>
          {isError && hasData && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7"
              loading={isFetching}
              onClick={() => void retryAttention()}
            >
              <RefreshCw aria-hidden="true" />
              Retry
            </Button>
          )}
        </div>
        {mutationFeedback && (
          <p
            role="status"
            aria-live="polite"
            className={cn(
              'text-xs',
              mutationFeedback.type === 'error'
                ? 'text-destructive'
                : 'text-success',
            )}
          >
            {mutationFeedback.message}
          </p>
        )}
      </CardHeader>

      <CardContent className="flex-1 overflow-auto pt-0 pb-3 px-0">
        {renderContent()}
      </CardContent>
    </Card>
  );
}
