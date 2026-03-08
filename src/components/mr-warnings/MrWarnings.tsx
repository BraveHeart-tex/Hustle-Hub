import {
  AlertCircleIcon,
  AlertTriangleIcon,
  InfoIcon,
  TriangleAlertIcon,
} from 'lucide-react';

import { Button } from '../ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { type MrWarning, mrWarningStrategies } from './mr-warning-strategies';

const severityConfig = {
  error: {
    icon: AlertCircleIcon,
    className: 'text-destructive',
    rowClassName: 'hover:bg-destructive/5',
    badgeClassName: 'bg-destructive/10 text-destructive',
  },
  warning: {
    icon: TriangleAlertIcon,
    className: 'text-yellow-600',
    rowClassName: 'hover:bg-yellow-50',
    badgeClassName: 'bg-yellow-100 text-yellow-700',
  },
  info: {
    icon: InfoIcon,
    className: 'text-blue-500',
    rowClassName: 'hover:bg-blue-50',
    badgeClassName: 'bg-blue-100 text-blue-700',
  },
} as const;

import { useEffect, useState } from 'react';

import { useTargetBranch } from '@/hooks/useTargetBranch';
import { useUrlChange } from '@/hooks/useUrlChange';

export const MrWarnings = ({
  container,
}: {
  container?: HTMLElement | null;
}) => {
  const { pathname } = useUrlChange();
  const isMergeRequestRoot = /^.+\/-\/merge_requests\/\d+$/.test(pathname);

  const [warnings, setWarnings] = useState<MrWarning[]>([]);
  const targetBranch = useTargetBranch();

  useEffect(() => {
    if (!targetBranch) {
      return;
    }

    const strategy = mrWarningStrategies[targetBranch];
    if (!strategy) return;

    const detected = strategy.checks
      .map((check) => check(document))
      .filter((w): w is MrWarning => w !== null);

    setWarnings(detected);
  }, [targetBranch]);

  if (warnings.length === 0 || !isMergeRequestRoot) {
    return null;
  }

  const errorCount = warnings.filter((w) => w.severity === 'error').length;
  const warningCount = warnings.filter((w) => w.severity === 'warning').length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="rounded-full shadow-sm gap-2 h-auto py-1.5 border-destructive/40 hover:border-destructive/70"
        >
          <AlertTriangleIcon className="h-3.5 w-3.5 shrink-0 text-destructive" />
          <div className="flex flex-col items-start leading-tight">
            <span className="text-xs">
              {targetBranch === 'main' ? 'Release' : 'Feature'} MR Warnings
            </span>
            <span className="text-[10px] text-muted-foreground font-medium">
              {errorCount > 0 &&
                `${errorCount} error${errorCount > 1 ? 's' : ''}`}
              {errorCount > 0 && warningCount > 0 && ' · '}
              {warningCount > 0 &&
                `${warningCount} warning${warningCount > 1 ? 's' : ''}`}
            </span>
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        container={container}
        side="top"
        align="end"
        className="w-80 p-0 overflow-hidden"
        onPointerDownOutside={(e) => {
          if (container?.contains(e.target as Node)) e.preventDefault();
        }}
        onInteractOutside={(e) => {
          if (container?.contains(e.target as Node)) e.preventDefault();
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 px-3 py-2.5 border-b bg-destructive/5">
          <AlertCircleIcon className="h-4 w-4 text-destructive shrink-0" />
          <span className="text-sm font-medium text-destructive">
            {warnings.length} issue{warnings.length > 1 ? 's' : ''} to resolve
          </span>
        </div>

        {/* Warning list */}
        <ul className="py-1">
          {warnings.map((warning) => {
            const config = severityConfig[warning.severity];
            const Icon = config.icon;
            return (
              <li
                key={warning.id}
                className={`flex items-start gap-2.5 px-3 py-2 transition-colors ${config.rowClassName}`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 mt-0.5 ${config.className}`}
                />
                <span className="text-xs text-foreground leading-relaxed">
                  {warning.message}
                </span>
                <span
                  className={`ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0 ${config.badgeClassName}`}
                >
                  {warning.severity}
                </span>
              </li>
            );
          })}
        </ul>
      </PopoverContent>
    </Popover>
  );
};
