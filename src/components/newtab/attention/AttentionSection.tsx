import {
  Bell,
  BellOff,
  CheckCheck,
  ChevronRight,
  Clock,
  GitMerge,
  MessageSquare,
  Ticket,
  Zap,
} from 'lucide-react';
import { useCallback, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAttention } from '@/hooks/useAttention';
import { ENDPOINTS } from '@/lib/endpoints';
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

// ------------------------------------------------------------
// Single attention item row
// ------------------------------------------------------------

function AttentionRow({
  item,
  onDismiss,
  onSnooze,
}: {
  item: AttentionItem;
  onDismiss: (id: string) => void;
  onSnooze: (id: string, duration: string) => void;
}) {
  const [showSnooze, setShowSnooze] = useState(false);
  const cfg = PRIORITY_CONFIG[item.priority];

  return (
    <div className="group relative flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/40">
      {/* Priority bar */}
      <div
        className={`absolute left-0 top-2 bottom-2 w-[3px] rounded-full ${cfg.bar}`}
      />

      {/* Priority dot */}
      <div className="mt-[5px] shrink-0">
        <span className={`block h-2 w-2 rounded-full ${cfg.dot}`} />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <a
            href={item.entityUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="flex items-center gap-1.5 text-sm font-medium leading-snug hover:underline underline-offset-2 truncate"
          >
            <SourceIcon item={item} />
            <span className="truncate">{item.title}</span>
            <ChevronRight
              size={11}
              className="shrink-0 text-muted-foreground/50"
            />
          </a>

          {/* Action buttons — visible on hover */}
          <div
            className={`flex items-center gap-1 shrink-0 transition-opacity ${showSnooze ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
          >
            <button
              onClick={() => setShowSnooze((v) => !v)}
              className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Snooze"
            >
              <Clock size={12} />
            </button>
            <button
              onClick={() => onDismiss(item.id)}
              className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Dismiss"
            >
              <CheckCheck size={12} />
            </button>
          </div>
        </div>

        {item.body && (
          <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed truncate">
            {item.body}
          </p>
        )}

        {/* Snooze picker */}
        {showSnooze && (
          <div className="mt-2 flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-muted-foreground">Snooze for:</span>
            {SNOOZE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  onSnooze(item.id, opt.value);
                  setShowSnooze(false);
                }}
                className="rounded border border-border px-2 py-0.5 text-xs hover:bg-muted hover:text-foreground text-muted-foreground transition-colors"
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// Priority group header
// ------------------------------------------------------------

function PriorityGroup({
  priority,
  items,
  onDismiss,
  onSnooze,
}: {
  priority: AttentionPriority;
  items: AttentionItem[];
  onDismiss: (id: string) => void;
  onSnooze: (id: string, duration: string) => void;
}) {
  if (items.length === 0) return null;
  const cfg = PRIORITY_CONFIG[priority];
  const label = { critical: 'Needs action', warning: 'Heads up', info: 'FYI' }[
    priority
  ];

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
          {items.length}
        </span>
      </div>
      <div className="flex flex-col gap-px">
        {items.map((item) => (
          <AttentionRow
            key={item.id}
            item={item}
            onDismiss={onDismiss}
            onSnooze={onSnooze}
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
      {[...Array(3)].map((_, i) => (
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

export default function AttentionSection() {
  const { data: items = [], isLoading, isError } = useAttention();

  const criticalItems = items.filter((i) => i.priority === 'critical');
  const warningItems = items.filter((i) => i.priority === 'warning');
  const infoItems = items.filter((i) => i.priority === 'info');
  const totalCount = items.length;

  const handleDismiss = useCallback(async (id: string) => {
    await fetch(ENDPOINTS.attention.dismiss(id), { method: 'PATCH' });
    // SSE will push the resolved event and update cache automatically
  }, []);

  const handleSnooze = useCallback(async (id: string, duration: string) => {
    await fetch(ENDPOINTS.attention.snooze(id), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ duration }),
    });
    // SSE will push the update automatically
  }, []);

  const renderContent = useCallback(() => {
    if (isLoading) return <AttentionSkeleton />;

    if (isError) {
      return (
        <p className="px-3 text-sm text-destructive font-medium">
          Failed to load attention feed.
        </p>
      );
    }

    if (totalCount === 0) {
      return (
        <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
          <BellOff size={22} className="text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            All clear. Nothing needs your attention.
          </p>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-3">
        <PriorityGroup
          priority="critical"
          items={criticalItems}
          onDismiss={handleDismiss}
          onSnooze={handleSnooze}
        />
        <PriorityGroup
          priority="warning"
          items={warningItems}
          onDismiss={handleDismiss}
          onSnooze={handleSnooze}
        />
        <PriorityGroup
          priority="info"
          items={infoItems}
          onDismiss={handleDismiss}
          onSnooze={handleSnooze}
        />
      </div>
    );
  }, [
    isLoading,
    isError,
    totalCount,
    criticalItems,
    warningItems,
    infoItems,
    handleDismiss,
    handleSnooze,
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
            <span>Attention</span>
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
              onClick={() => infoItems.forEach((i) => handleDismiss(i.id))}
            >
              <CheckCheck size={12} />
              Clear FYIs
            </Button>
          )}
        </CardTitle>

        {/* Live indicator */}
        {!isLoading && (
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] text-muted-foreground">Live</span>
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 overflow-auto pt-0 pb-3 px-0">
        {renderContent()}
      </CardContent>
    </Card>
  );
}
