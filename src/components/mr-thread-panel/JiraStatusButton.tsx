import { ExternalLinkIcon, Loader2Icon, SparklesIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import JiraIcon from '@/components/misc/JiraIcon';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { extractFerelId } from '@/lib/utils/misc/extractFerelId';

interface JiraTransition {
  id: string;
  name: string;
  to: { name: string; statusCategory: { colorName: string } };
}

interface JiraIssueDetails {
  key: string;
  fields: {
    summary: string;
    status: { name: string; statusCategory: { colorName: string } };
    priority: { name: string; iconUrl: string };
    assignee: { displayName: string; avatarUrls: { '24x24': string } } | null;
    description: unknown;
  };
  transitions: JiraTransition[];
}

interface JiraTransition {
  id: string;
  name: string;
  to: { name: string; statusCategory: { colorName: string } };
}

interface JiraIssueDetails {
  key: string;
  fields: {
    summary: string;
    status: { name: string; statusCategory: { colorName: string } };
    priority: { name: string; iconUrl: string };
    assignee: { displayName: string; avatarUrls: { '24x24': string } } | null;
    description: unknown;
  };
  transitions: JiraTransition[];
}

const statusNameColors: Record<string, string> = {
  'Code Review': 'bg-purple-100 text-purple-700 border border-purple-200',
  'In Progress': 'bg-amber-100 text-amber-700 border border-amber-200',
  Blocked: 'bg-red-100 text-red-700 border border-red-200',
  QA: 'bg-cyan-100 text-cyan-700 border border-cyan-200',
  Testing: 'bg-cyan-100 text-cyan-700 border border-cyan-200',
  UAT: 'bg-indigo-100 text-indigo-700 border border-indigo-200',
  Done: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  Canceled: 'bg-gray-100 text-gray-500 border border-gray-200',
  Backlog: 'bg-slate-100 text-slate-600 border border-slate-200',
  'To Do': 'bg-blue-100 text-blue-700 border border-blue-200',
};

const statusCategoryColors: Record<string, string> = {
  'blue-gray': 'bg-blue-100 text-blue-700 border border-blue-200',
  yellow: 'bg-amber-100 text-amber-700 border border-amber-200',
  green: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  'medium-gray': 'bg-gray-100 text-gray-600 border border-gray-200',
};

const statusDotColors: Record<string, string> = {
  'Code Review': 'bg-purple-500',
  'In Progress': 'bg-amber-500',
  Blocked: 'bg-red-500',
  QA: 'bg-cyan-500',
  Testing: 'bg-cyan-500',
  UAT: 'bg-indigo-500',
  Done: 'bg-emerald-500',
  Canceled: 'bg-gray-400',
  Backlog: 'bg-slate-400',
  'To Do': 'bg-blue-500',
};

const getStatusColor = (status: JiraIssueDetails['fields']['status']) =>
  statusNameColors[status.name] ??
  statusCategoryColors[status.statusCategory.colorName] ??
  'bg-gray-100 text-gray-600 border border-gray-200';

const getStatusDot = (statusName: string) =>
  statusDotColors[statusName] ?? 'bg-gray-300';

const API_BASE = `${import.meta.env.VITE_BASE_API_URL}/data/jira/issues`;

export const JiraStatusButton = ({
  jiraId,
  jiraLink,
  container,
}: {
  jiraId: string;
  jiraLink: string;
  container?: HTMLElement | null;
}) => {
  const [open, setOpen] = useState(false);
  const [details, setDetails] = useState<JiraIssueDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [transitioning, setTransitioning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchedRef = useRef(false);
  const targetBranch = useTargetBranch();

  const resolvedJiraId = useMemo(() => {
    if (targetBranch === 'main') {
      const ferelId = extractFerelId(document);
      if (ferelId) return ferelId;
      return null;
    }
    return jiraId;
  }, [targetBranch, jiraId]);

  useEffect(() => {
    if (fetchedRef.current || !targetBranch || !resolvedJiraId) return;
    fetchedRef.current = true;
    setLoading(true);
    fetch(`${API_BASE}/${resolvedJiraId}`)
      .then((r) => r.json())
      .then((data) => setDetails(data.data))
      .catch(() => setError('Failed to load issue details'))
      .finally(() => setLoading(false));
  }, [resolvedJiraId, targetBranch]);

  const handleTransition = async (transition: JiraTransition) => {
    setTransitioning(transition.id);
    try {
      await fetch(`${API_BASE}/${resolvedJiraId}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transitionId: transition.id }),
      });

      if (targetBranch === 'main') {
        await fetch(`${API_BASE}/${resolvedJiraId}/comment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mrUrl: window.location.href,
            mrTitle:
              document
                .querySelector("[data-testid='title-content']")
                ?.textContent?.trim() ?? '',
          }),
        }).catch(() => {
          // Comment failure shouldn't block the transition
        });
      }

      setDetails((prev) =>
        prev
          ? {
              ...prev,
              fields: { ...prev.fields, status: transition.to },
              transitions: prev.transitions.filter(
                (t) => t.id !== transition.id,
              ),
            }
          : prev,
      );
    } catch {
      setError('Failed to update status');
    } finally {
      setTransitioning(null);
    }
  };

  const recommendedTransitionName = useMemo(() => {
    if (!details || !targetBranch) return null;
    const status = details.fields.status.name.toLowerCase();

    if (targetBranch === 'main' && status === 'to do') {
      return 'Send to Code Review';
    }

    if (
      targetBranch === 'develop' &&
      (status === 'in progress' || status === 'to do')
    ) {
      return 'Code Review';
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

  const statusColor = details ? getStatusColor(details.fields.status) : '';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setOpen((prev) => !prev)}
          className="rounded-full shadow-sm gap-1.5 h-auto py-1.5"
        >
          <a
            href={jiraLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="shrink-0"
          >
            <JiraIcon className="h-3.5 w-3.5 shrink-0 text-blue-500" />
          </a>
          <div className="flex flex-col items-start leading-tight">
            <span className="text-xs">{resolvedJiraId}</span>
            {details && (
              <span
                className={`text-[10px] font-medium px-1 rounded ${statusColor}`}
              >
                {details.fields.status.name}
              </span>
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
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2Icon className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {error && (
          <div className="px-3 py-4 text-xs text-destructive">{error}</div>
        )}

        {details && !loading && (
          <>
            {/* Header */}
            <div className="flex items-center gap-2 px-3 py-2.5 border-b bg-muted/40">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {details.key}
                  </span>
                  <span
                    className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${statusColor}`}
                  >
                    {details.fields.status.name}
                  </span>
                </div>
                <p className="text-xs font-medium leading-snug line-clamp-2">
                  {details.fields.summary}
                </p>
              </div>
              <a
                href={jiraLink}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 text-muted-foreground hover:text-foreground transition-colors mt-0.5"
              >
                <ExternalLinkIcon className="h-3.5 w-3.5" />
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
                    <AvatarFallback className="text-[8px]">
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
              <div className="flex items-center gap-1">
                <img
                  src={details.fields.priority.iconUrl}
                  className="h-3 w-3"
                />
                <span className="text-[10px] text-muted-foreground">
                  {details.fields.priority.name}
                </span>
              </div>
            </div>

            {/* Transitions */}
            {details.transitions.length > 0 && (
              <div className="py-1">
                <p className="px-3 py-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
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
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-muted/60 transition-colors disabled:opacity-50 group"
                    >
                      <span
                        className={`h-2 w-2 rounded-full shrink-0 ${getStatusDot(transition.to.name)}`}
                      />
                      <div className="text-xs flex-1 flex items-center gap-2">
                        <span>{transition.name}</span>
                        {isRecommended && (
                          <SparklesIcon className="h-3 w-3 text-emerald-500 shrink-0" />
                        )}
                      </div>
                      <span
                        className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${getStatusColor(transition.to)}`}
                      >
                        {transition.to.name}
                      </span>
                      {transitioning === transition.id && (
                        <Loader2Icon className="h-3 w-3 animate-spin text-muted-foreground" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}
      </PopoverContent>
    </Popover>
  );
};
