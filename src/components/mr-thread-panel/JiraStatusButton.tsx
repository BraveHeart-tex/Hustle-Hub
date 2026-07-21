import { ExternalLinkIcon, Loader2Icon, SparklesIcon } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { JiraIcon } from '@/components/misc/JiraIcon';
import { SEGMENT_CLASS } from '@/components/mr-thread-panel/segment';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useIsReadOnly } from '@/hooks/useIsReadOnly';
import { useTargetBranch } from '@/hooks/useTargetBranch';
import { cn } from '@/lib/utils';
import { extractFerelId } from '@/lib/utils/misc/extractFerelId';
import {
  addJiraIssueComment,
  fetchJiraIssueDetails,
  type JiraIssueDetails,
  type JiraTransition,
  transitionJiraIssue,
} from '@/services/jira';

// Jira workflow statuses translated into the operational semantic roles.
// Color always pairs with the status name text, so it never carries meaning
// on its own, and every tone maps to a token with light/dark parity.
type StatusTone = 'neutral' | 'info' | 'warning' | 'success' | 'critical';

interface JiraStatusLike {
  name: string;
  statusCategory: { colorName: string };
}

const toneDotClass: Record<StatusTone, string> = {
  neutral: 'bg-muted-foreground/50',
  info: 'bg-info',
  warning: 'bg-warning',
  success: 'bg-success',
  critical: 'bg-destructive',
};

const statusToneByName: Record<string, StatusTone> = {
  'code review': 'info',
  'on review': 'info',
  'in progress': 'info',
  qa: 'info',
  testing: 'info',
  uat: 'info',
  blocked: 'critical',
  done: 'success',
  canceled: 'neutral',
  cancelled: 'neutral',
  backlog: 'neutral',
  'to do': 'neutral',
};

// Jira's own status-category color names, used when a specific status name
// isn't mapped above.
const statusToneByCategory: Record<string, StatusTone> = {
  green: 'success',
  yellow: 'info',
  'blue-gray': 'neutral',
  'medium-gray': 'neutral',
};

const getStatusTone = (status: JiraStatusLike): StatusTone =>
  statusToneByName[status.name.toLowerCase()] ??
  statusToneByCategory[status.statusCategory.colorName] ??
  'neutral';

const StatusLabel = ({
  status,
  className,
}: {
  status: JiraStatusLike;
  className?: string;
}) => (
  <span
    className={cn(
      'inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground',
      className,
    )}
  >
    <span
      aria-hidden="true"
      className={cn(
        'size-1.5 shrink-0 rounded-full',
        toneDotClass[getStatusTone(status)],
      )}
    />
    {status.name}
  </span>
);

export const JiraStatusButton = ({
  jiraId,
  jiraLink,
  container,
  gitlabUserId,
}: {
  jiraId: string;
  jiraLink: string;
  container?: HTMLElement | null;
  gitlabUserId: string;
}) => {
  const [open, setOpen] = useState(false);
  const [details, setDetails] = useState<JiraIssueDetails | null>(null);

  const [loading, setLoading] = useState(false);
  const [transitioning, setTransitioning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchedRef = useRef(false);
  const targetBranch = useTargetBranch();
  const readOnly = useIsReadOnly(gitlabUserId);

  const resolvedJiraId = useMemo(() => {
    if (targetBranch === 'main') {
      const ferelId = extractFerelId(document);
      if (ferelId) return ferelId;
      return null;
    }
    return jiraId;
  }, [targetBranch, jiraId]);

  const fetchTaskDetails = useCallback(() => {
    if (!resolvedJiraId) return;
    setLoading(true);
    fetchJiraIssueDetails(resolvedJiraId)
      .then((data) => setDetails(data))
      .catch(() => setError('Failed to load issue details'))
      .finally(() => setLoading(false));
  }, [resolvedJiraId]);

  useEffect(() => {
    if (fetchedRef.current || !targetBranch || !resolvedJiraId) return;
    fetchedRef.current = true;
    fetchTaskDetails();
  }, [fetchTaskDetails, resolvedJiraId, targetBranch]);

  const handleTransition = async (transition: JiraTransition) => {
    if (!resolvedJiraId) return;

    setTransitioning(transition.id);
    try {
      await transitionJiraIssue(resolvedJiraId, transition.id);

      if (
        targetBranch === 'main' &&
        transition.name === 'Send to Code Review'
      ) {
        await addJiraIssueComment({
          jiraId: resolvedJiraId,
          mrUrl: window.location.href,
        }).catch(() => {
          // Comment failure shouldn't block the transition
        });
      }

      fetchTaskDetails();
    } catch {
      setError('Failed to update status');
    } finally {
      setTransitioning(null);
    }
  };

  const recommendedTransitionName = useMemo(() => {
    if (!details?.fields.status || !targetBranch) return null;
    const status = details.fields.status.name.toLowerCase();

    if (targetBranch === 'main' && status === 'to do') {
      return 'On Review';
    }

    if (targetBranch === 'develop') {
      if (status === 'in progress' || status === 'to do') {
        return 'Code Review';
      }

      if (status === 'code review') {
        return 'Testing';
      }
    }

    return null;
  }, [details, targetBranch]);

  const sortedTransitions = useMemo(() => {
    if (!details?.transitions) return [];

    return [...details.transitions].sort((a, b) => {
      const aRec =
        a.to.name.toLowerCase() === recommendedTransitionName?.toLowerCase();
      const bRec =
        b.to.name.toLowerCase() === recommendedTransitionName?.toLowerCase();
      return aRec === bRec ? 0 : aRec ? -1 : 1;
    });
  }, [details?.transitions, recommendedTransitionName]);

  if (!resolvedJiraId || !targetBranch) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setOpen((prev) => !prev)}
          className={SEGMENT_CLASS}
        >
          {/* Decorative: the segment opens the popover, which carries the
              external "open in Jira" link. A nested <a> here would be invalid
              inside a <button>. */}
          <JiraIcon
            aria-hidden="true"
            className="h-3.5 w-3.5 shrink-0 text-blue-500"
          />
          <div className="flex flex-col items-start leading-tight">
            <span className="text-xs text-muted-foreground">
              {resolvedJiraId}
            </span>
            {details?.fields.status && (
              <StatusLabel status={details.fields.status} />
            )}
            {!details && (
              <span className="text-[10px] text-muted-foreground">
                Jira Task
              </span>
            )}
          </div>
        </Button>
      </PopoverTrigger>

      <PopoverContent
        container={container}
        side="top"
        align="end"
        className="w-80 p-0 overflow-hidden"
      >
        {error && (
          <div role="alert" className="px-3 py-4 text-xs text-destructive">
            {error}
          </div>
        )}

        {details ? (
          // Show existing details even while loading
          <div className={cn(loading && 'opacity-50 pointer-events-none')}>
            {/* Header */}
            <div className="flex items-center gap-2 px-3 py-2.5 border-b bg-muted/40">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {details.key}
                  </span>
                  {details.fields.status && (
                    <StatusLabel status={details.fields.status} />
                  )}
                </div>
                <p className="text-xs font-medium leading-snug line-clamp-2">
                  {details.fields.summary}
                </p>
              </div>
              <a
                href={jiraLink}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Open ${details.key} in Jira`}
                className="shrink-0 text-muted-foreground hover:text-foreground transition-colors mt-0.5"
              >
                <ExternalLinkIcon aria-hidden="true" className="h-3.5 w-3.5" />
              </a>
            </div>

            {/* Meta */}
            <div className="flex items-center gap-3 px-3 py-2 border-b">
              {details.fields.assignee && (
                <div className="flex items-center gap-1.5">
                  <Avatar className="h-4 w-4">
                    <AvatarImage
                      src={details.fields.assignee.avatarUrls['24x24']}
                    />
                    <AvatarFallback className="text-[10px]">
                      {details.fields.assignee.displayName
                        .slice(0, 2)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-[10px] text-muted-foreground">
                    {details.fields.assignee.displayName}
                  </span>
                </div>
              )}
              {details.fields.priority && (
                <div className="flex items-center gap-1">
                  <img
                    src={details.fields.priority.iconUrl}
                    className="h-3 w-3"
                  />
                  <span className="text-[10px] text-muted-foreground">
                    {details.fields.priority.name}
                  </span>
                </div>
              )}
            </div>

            {/* Transitions */}
            {!readOnly && details.transitions.length > 0 && (
              <div className="py-1">
                <p className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Move to
                </p>
                {sortedTransitions.map((transition) => {
                  const isRecommended =
                    !!recommendedTransitionName &&
                    transition.to.name.toLowerCase() ===
                      recommendedTransitionName.toLowerCase();

                  return (
                    <button
                      key={transition.id}
                      onClick={() => handleTransition(transition)}
                      disabled={transitioning !== null}
                      aria-busy={transitioning === transition.id}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50 transition-colors motion-reduce:transition-none disabled:opacity-50 group"
                    >
                      <span
                        aria-hidden="true"
                        className={cn(
                          'h-2 w-2 rounded-full shrink-0',
                          toneDotClass[getStatusTone(transition.to)],
                        )}
                      />
                      <div className="text-xs flex-1 flex items-center gap-2">
                        <span>{transition.name}</span>
                        {isRecommended && (
                          <SparklesIcon className="h-3 w-3 text-success shrink-0" />
                        )}
                      </div>
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                        {transition.to.name}
                      </span>
                      {transitioning === transition.id && (
                        <Loader2Icon
                          aria-hidden="true"
                          className="h-3 w-3 animate-spin text-muted-foreground motion-reduce:animate-none"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div role="status" className="flex items-center justify-center py-8">
            <Loader2Icon
              aria-hidden="true"
              className="h-5 w-5 animate-spin text-muted-foreground motion-reduce:animate-none"
            />
            <span className="sr-only">Loading issue details</span>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};
