import '@/assets/tailwind.css';

import {
  AlertCircleIcon,
  Clock3Icon,
  ExternalLinkIcon,
  GitCommitHorizontalIcon,
  PackageIcon,
  RocketIcon,
} from 'lucide-react';
import { StrictMode, useEffect, useState } from 'react';

import { BottomRightPanel } from '@/components/mr-thread-panel/BottomRightPanel';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ENDPOINTS } from '@/lib/endpoints';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils/formatters/formatDate';
import {
  type GitlabTagDetails,
  type GitlabTagDetailsApiResponse,
} from '@/types/gitlab';

type DeploymentWidgetState =
  | { status: 'loading' }
  | { status: 'empty' }
  | { status: 'error'; message: string }
  | { status: 'success'; details: GitlabTagDetails };

const truncateDeploymentId = (deploymentId: string) =>
  deploymentId.length > 16
    ? `${deploymentId.slice(0, 8)}...${deploymentId.slice(-6)}`
    : deploymentId;

const getCommitSha = (webUrl: string) => {
  const commitRef = webUrl.split('/').pop();
  return commitRef ? commitRef.slice(0, 8) : 'commit';
};

const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

const getMessageBody = (details: GitlabTagDetails) => {
  const message = details.message.trim();
  if (!message || message === details.title.trim()) {
    return null;
  }

  return message;
};

const isTagDetailsEmpty = (details: GitlabTagDetails | null | undefined) =>
  !details ||
  (!details.title.trim() && !details.message.trim() && !details.webUrl.trim());

const triggerTone = {
  loading:
    'border-border bg-secondary text-secondary-foreground hover:bg-accent',
  empty: 'border-border bg-background text-foreground hover:bg-accent',
  error:
    'border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/15',
  success: 'border-border bg-background text-foreground hover:bg-accent',
} as const;

const dotTone = {
  loading: 'bg-primary animate-pulse',
  empty: 'bg-muted-foreground/50',
  error: 'bg-destructive',
  success: 'bg-primary',
} as const;

const statusLabel = {
  loading: 'Loading details',
  empty: 'No details found',
  error: 'Unavailable',
  success: 'Ready to inspect',
} as const;

const titleByState = (
  status: DeploymentWidgetState['status'],
  deploymentId: string,
  details: GitlabTagDetails | null,
) => {
  if (status === 'success' && details) {
    return details.title;
  }

  if (status === 'empty') {
    return `No tag details for ${deploymentId}`;
  }

  if (status === 'error') {
    return `Could not load ${deploymentId}`;
  }

  return `Deployment ${deploymentId}`;
};

export const DeploymentWidgetApp = ({
  container,
  deploymentId,
  projectPath,
}: {
  container: HTMLElement;
  deploymentId: string;
  projectPath: string;
}) => {
  const [state, setState] = useState<DeploymentWidgetState>({
    status: 'loading',
  });

  useEffect(() => {
    let cancelled = false;

    const fetchDetails = async () => {
      setState({ status: 'loading' });

      try {
        const response = await fetch(
          ENDPOINTS.gitlab.tagDetails({
            projectPath,
            tag: deploymentId,
          }),
        );

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const data = (await response.json()) as GitlabTagDetailsApiResponse;

        if (!data.success) {
          throw new Error(data.error.message);
        }

        if (!cancelled) {
          setState(
            isTagDetailsEmpty(data.data)
              ? { status: 'empty' }
              : { status: 'success', details: data.data },
          );
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        setState({
          status: 'error',
          message:
            error instanceof Error
              ? error.message
              : 'Unknown error while fetching tag details.',
        });
      }
    };

    fetchDetails();

    return () => {
      cancelled = true;
    };
  }, [deploymentId, projectPath]);

  const shortId = truncateDeploymentId(deploymentId);
  const details = state.status === 'success' ? state.details : null;
  const messageBody = details ? getMessageBody(details) : null;
  const commitSha = details ? getCommitSha(details.webUrl) : null;
  const title = titleByState(state.status, deploymentId, details);

  return (
    <StrictMode>
      <BottomRightPanel>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                'h-11 w-11 rounded-full border px-0 py-0 shadow-lg backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5',
                'supports-backdrop-filter:bg-background/85',
                triggerTone[state.status],
              )}
              aria-label={`Open deployment details for ${deploymentId}`}
            >
              <span className="relative inline-flex items-center justify-center">
                <RocketIcon className="h-4 w-4" />
                <span
                  className={cn(
                    'absolute -right-1.5 -top-1.5 inline-flex h-2.5 w-2.5 rounded-full border border-background',
                    dotTone[state.status],
                  )}
                />
              </span>
            </Button>
          </PopoverTrigger>

          <PopoverContent
            container={container}
            side="top"
            align="end"
            sideOffset={12}
            className="w-[min(380px,calc(100vw-24px))] overflow-hidden rounded-[28px] border-border/70 bg-popover p-0 shadow-2xl"
            onPointerDownOutside={(event) => {
              if (container.contains(event.target as Node)) {
                event.preventDefault();
              }
            }}
            onInteractOutside={(event) => {
              if (container.contains(event.target as Node)) {
                event.preventDefault();
              }
            }}
          >
            <div className="border-b border-border/60 bg-muted/35 px-4 py-4">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground shadow-sm">
                    <RocketIcon className="h-3.5 w-3.5 text-foreground" />
                    Tag Deployment
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    {title}
                  </p>
                </div>

                <div className="rounded-2xl border border-border/70 bg-background/80 px-3 py-2 text-right shadow-sm">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Tag
                  </p>
                  <p className="font-mono text-xs text-foreground">{shortId}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-2xl border border-border/70 bg-background/75 px-3 py-2 shadow-sm">
                  <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    <GitCommitHorizontalIcon className="h-3.5 w-3.5" />
                    Commit
                  </div>
                  <p className="font-mono text-xs text-foreground">
                    {commitSha ?? 'N/A'}
                  </p>
                </div>

                <div className="rounded-2xl border border-border/70 bg-background/75 px-3 py-2 shadow-sm">
                  <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    <PackageIcon className="h-3.5 w-3.5" />
                    Status
                  </div>
                  <p className="text-xs font-medium text-foreground">
                    {statusLabel[state.status]}
                  </p>
                </div>
              </div>
            </div>

            {state.status === 'loading' && (
              <div className="space-y-3 px-4 py-4">
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <Clock3Icon className="h-4 w-4 animate-pulse text-muted-foreground" />
                  Loading tag details from GitLab.
                </div>
                <div className="space-y-2">
                  <div className="h-3 w-3/4 rounded-full bg-muted" />
                  <div className="h-3 w-5/6 rounded-full bg-muted/70" />
                  <div className="h-3 w-2/3 rounded-full bg-muted/70" />
                </div>
              </div>
            )}

            {state.status === 'empty' && (
              <div className="px-4 py-4">
                <div className="rounded-2xl border border-border/70 bg-muted/35 p-3">
                  <div className="mb-1 flex items-center gap-2 text-sm font-medium text-foreground">
                    <PackageIcon className="h-4 w-4 text-muted-foreground" />
                    No tag details found
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    This deployment tag was found on the page, but the API did
                    not return any commit details.
                  </p>
                </div>
              </div>
            )}

            {state.status === 'error' && (
              <div className="px-4 py-4">
                <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-3">
                  <div className="mb-1 flex items-center gap-2 text-sm font-medium text-destructive">
                    <AlertCircleIcon className="h-4 w-4" />
                    Tag details could not be loaded
                  </div>
                  <p className="text-xs leading-relaxed text-destructive/90">
                    {state.message}
                  </p>
                </div>
              </div>
            )}

            {details && (
              <div className="bg-popover px-4 py-4">
                <div className="mb-4 flex items-center gap-3 rounded-2xl border border-border/70 bg-muted/35 p-3">
                  <Avatar size="lg" className="ring-2 ring-background">
                    <AvatarImage
                      src={
                        details.authorAvatar.startsWith('https')
                          ? details.authorAvatar
                          : `https://gitlab.com${details.authorAvatar}`
                      }
                      loading="lazy"
                      fetchPriority="low"
                      alt={details.authorName}
                    />
                    <AvatarFallback>
                      {getInitials(details.authorName)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {details.authorName}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <Clock3Icon className="h-3.5 w-3.5" />
                      <span>{formatDate(details.authoredDate)}</span>
                    </div>
                  </div>
                </div>

                {messageBody && (
                  <div className="mb-4 rounded-2xl border border-border/70 bg-muted/30 p-3">
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Commit message
                    </p>
                    <p className="whitespace-pre-wrap text-xs leading-5 text-foreground/80">
                      {messageBody}
                    </p>
                  </div>
                )}

                <Button asChild className="h-10 w-full rounded-2xl">
                  <a
                    href={details.webUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open commit in GitLab
                    <ExternalLinkIcon className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>
      </BottomRightPanel>
    </StrictMode>
  );
};
