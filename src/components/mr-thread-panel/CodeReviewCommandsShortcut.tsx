import {
  BotIcon,
  CheckIcon,
  CopyIcon,
  Loader2Icon,
  PlayIcon,
  RotateCcwIcon,
  SquareIcon,
  TerminalIcon,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { ENDPOINTS } from '@/lib/endpoints';
import { extractJiraId } from '@/lib/utils/misc/extractJiraId';

import { ReviewMarkdown } from '../ReviewMarkdown';
import { Button } from '../ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { ScrollArea } from '../ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

interface BranchInfo {
  source: string;
  target: string;
}

const commands: {
  id: string;
  label: string;
  description: string;
  command: string | ((branches: BranchInfo) => string);
}[] = [
  {
    id: 'checkout-target',
    label: 'Checkout target',
    description: 'Switch to target branch first',
    command: ({ target }) => `git checkout ${target}`,
  },
  {
    id: 'pull-target',
    label: 'Pull target',
    description: 'Get latest target branch',
    command: ({ target }) => `git pull --rebase origin ${target}`,
  },
  {
    id: 'checkout-source',
    label: 'Checkout source',
    description: 'Switch to feature branch',
    command: ({ source }) => `git checkout ${source}`,
  },
  {
    id: 'fetch-origin',
    label: 'Fetch origin',
    description: 'Fetch all remote refs',
    command: 'git fetch origin',
  },
  {
    id: 'pull-source',
    label: 'Pull source',
    description: 'Get latest changes for this branch',
    command: ({ source }) => `git pull --rebase origin ${source}`,
  },
  {
    id: 'mrdiff',
    label: 'Run mrdiff',
    description: 'Copy full diff to clipboard',
    command: ({ target }) => `BASE=origin/${target} && (
      echo "### Branch ###"
      git branch --show-current
      echo ""
      echo "### Commits ###"
      git log --oneline $BASE..HEAD
      echo ""
      echo "### Diff Stats ###"
      git diff --stat $BASE...HEAD
      echo ""
      echo "### Full Diff ###"
      git diff -w $BASE...HEAD -- ':!*.lock' ':!*.svg'
    ) | tee mr.diff | pbcopy && echo "✅ MR context + diff copied"`,
  },
];

const resolveCommand = (
  cmd: (typeof commands)[number],
  branches: BranchInfo,
): string =>
  typeof cmd.command === 'function' ? cmd.command(branches) : cmd.command;

const allCommands = (branches: BranchInfo) =>
  commands.map((c) => resolveCommand(c, branches)).join('\n');

const getSourceBranch = (doc: Document): string =>
  doc.querySelector<HTMLButtonElement>('.js-source-branch-copy')?.dataset
    .clipboardText ?? '';

const getTargetBranch = (doc: Document): string => {
  const refs = doc.querySelectorAll<HTMLAnchorElement>('.ref-container');
  return refs[1]?.title ?? '';
};

type ReviewStatus = 'idle' | 'streaming' | 'done' | 'error' | 'cancelled';

interface CodeReviewCommandsShortcutProps {
  container: HTMLElement | null;
}

export const CodeReviewCommandsShortcut = ({
  container,
}: CodeReviewCommandsShortcutProps) => {
  const [open, setOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [branchInfo, setBranchInfo] = useState({ target: '', source: '' });
  const [reviewContent, setReviewContent] = useState('');
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus>('idle');
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setBranchInfo({
      target: getTargetBranch(document),
      source: getSourceBranch(document),
    });
  }, [container]);

  const copy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  async function runReview() {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setReviewContent('');
    setReviewStatus('streaming');

    const projectPath = window.location.pathname
      .split('/-/merge_requests')[0]
      .slice(1);
    const mrIid = window.location.pathname
      .split('/merge_requests/')[1]
      .split('/')[0];
    const mrTitle = document.querySelector('.title')?.textContent?.trim();

    try {
      const response = await fetch(ENDPOINTS.reviews.request, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectPath,
          mrIid,
          targetBranch: branchInfo.target,
          mrTitle,
          mrAuthor: document.querySelector('.author-link')?.textContent?.trim(),
          ticketKey: extractJiraId(mrTitle || ''),
        }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) throw new Error('Review request failed');

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setReviewContent(
          (prev) => prev + decoder.decode(value, { stream: true }),
        );
      }
      setReviewStatus('done');
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        setReviewStatus('cancelled');
        return;
      }
      setReviewStatus('error');
    } finally {
      abortRef.current = null;
    }
  }

  function cancelReview() {
    abortRef.current?.abort();
    setReviewStatus('cancelled');
  }

  if (!branchInfo.source || !branchInfo.target) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="rounded-full shadow-sm gap-2 h-8 px-3 border-border/60 hover:border-border hover:bg-muted/50 transition-all"
        >
          <TerminalIcon className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-medium">Review Tools</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent
        container={container}
        side="top"
        align="end"
        sideOffset={8}
        className="w-[min(800px,92vw)] p-0 overflow-hidden shadow-xl border-border/50"
      >
        <Tabs defaultValue="commands">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b bg-muted/30">
            <TabsList className="h-7 p-0.5 bg-background/60">
              <TabsTrigger
                value="commands"
                className="text-xs h-6 px-3 gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <TerminalIcon className="h-3 w-3" />
                Commands
              </TabsTrigger>
              <TabsTrigger
                value="review"
                className="text-xs h-6 px-3 gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <BotIcon className="h-3 w-3" />
                AI Review
                {reviewStatus === 'streaming' && (
                  <Loader2Icon className="h-2.5 w-2.5 animate-spin text-blue-500" />
                )}
                {reviewStatus === 'done' && (
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500 inline-block" />
                )}
                {reviewStatus === 'error' && (
                  <span className="h-1.5 w-1.5 rounded-full bg-destructive inline-block" />
                )}
              </TabsTrigger>
            </TabsList>

            {/* Branch pill */}
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground bg-muted/60 rounded-full px-2.5 py-1 font-mono border border-border/30">
              <span className="text-foreground/70 max-w-[120px] truncate">
                {branchInfo.source}
              </span>
              <span>→</span>
              <span className="max-w-[80px] truncate">{branchInfo.target}</span>
            </div>
          </div>

          {/* Commands tab */}
          <TabsContent value="commands" className="mt-0">
            <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/10">
              <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">
                {commands.length} steps
              </span>
              <button
                onClick={() => copy('all', allCommands(branchInfo))}
                className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-muted/60"
              >
                {copiedId === 'all' ? (
                  <CheckIcon className="h-3 w-3 text-green-500" />
                ) : (
                  <CopyIcon className="h-3 w-3" />
                )}
                {copiedId === 'all' ? 'Copied!' : 'Copy all'}
              </button>
            </div>

            <ul className="py-1">
              {commands.map((cmd, index) => {
                const resolved = resolveCommand(cmd, branchInfo);
                const isCopied = copiedId === cmd.id;
                return (
                  <li key={cmd.id}>
                    <button
                      onClick={() => copy(cmd.id, resolved)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-muted/50 transition-colors group"
                    >
                      <span className="text-[10px] font-mono text-muted-foreground/60 w-4 shrink-0 tabular-nums">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <div className="flex flex-col flex-1 min-w-0 gap-0.5">
                        <span className="text-xs font-medium text-foreground">
                          {cmd.label}
                        </span>
                        <span className="text-[10px] text-muted-foreground truncate">
                          {cmd.description}
                        </span>
                      </div>
                      <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        {isCopied ? (
                          <div className="flex items-center gap-1 text-[10px] text-green-600 font-medium">
                            <CheckIcon className="h-3 w-3" />
                            Copied
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <CopyIcon className="h-3 w-3" />
                            Copy
                          </div>
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </TabsContent>

          {/* AI Review tab */}
          <TabsContent value="review" className="mt-0">
            {/* Review toolbar */}
            <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/10">
              <div className="flex items-center gap-2">
                <ReviewStatusBadge status={reviewStatus} />
              </div>

              <div className="flex items-center gap-1">
                {reviewStatus === 'streaming' && (
                  <button
                    onClick={cancelReview}
                    className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-muted/60"
                  >
                    <SquareIcon className="h-3 w-3" />
                    Stop
                  </button>
                )}
                {reviewStatus === 'idle' && (
                  <button
                    onClick={runReview}
                    className="flex items-center gap-1.5 text-[11px] text-foreground font-medium transition-colors px-2.5 py-1 rounded bg-foreground/5 hover:bg-foreground/10 border border-border/50"
                  >
                    <PlayIcon className="h-3 w-3" />
                    Run review
                  </button>
                )}
                {(reviewStatus === 'done' ||
                  reviewStatus === 'error' ||
                  reviewStatus === 'cancelled') && (
                  <button
                    onClick={runReview}
                    className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-muted/60"
                  >
                    <RotateCcwIcon className="h-3 w-3" />
                    Re-run
                  </button>
                )}
              </div>
            </div>

            {/* Review content */}
            <ScrollArea className="h-[min(640px,70vh)]">
              <div className="px-4 py-4 min-w-0 max-w-full overflow-hidden">
                {reviewStatus === 'idle' && (
                  <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                    <div className="h-10 w-10 rounded-full bg-muted/60 flex items-center justify-center">
                      <BotIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">
                        Ready to review
                      </p>
                      <p className="text-xs text-muted-foreground max-w-[240px]">
                        Run an AI review of this MR against your team&apos;s
                        conventions and best practices.
                      </p>
                    </div>
                    <button
                      onClick={runReview}
                      className="mt-2 flex items-center gap-2 text-xs font-medium text-foreground px-4 py-2 rounded-full bg-foreground/5 hover:bg-foreground/10 border border-border/60 transition-colors"
                    >
                      <PlayIcon className="h-3.5 w-3.5" />
                      Run review
                    </button>
                  </div>
                )}

                {reviewStatus === 'error' && (
                  <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                    <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                      <span className="text-destructive text-lg">!</span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">
                        Review failed
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Check your connection and try again.
                      </p>
                    </div>
                    <button
                      onClick={runReview}
                      className="mt-1 flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <RotateCcwIcon className="h-3 w-3" />
                      Try again
                    </button>
                  </div>
                )}

                {reviewStatus === 'streaming' && !reviewContent && (
                  <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                    <Loader2Icon className="h-4 w-4 animate-spin" />
                    Analyzing diff...
                  </div>
                )}

                {reviewContent && <ReviewMarkdown content={reviewContent} />}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
};

function ReviewStatusBadge({ status }: { status: ReviewStatus }) {
  if (status === 'idle') return null;

  const config = {
    streaming: {
      label: 'Reviewing',
      className:
        'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-400',
      icon: <Loader2Icon className="h-3 w-3 animate-spin" />,
    },
    done: {
      label: 'Done',
      className:
        'text-green-700 bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800 dark:text-green-400',
      icon: <CheckIcon className="h-3 w-3" />,
    },
    error: {
      label: 'Failed',
      className: 'text-destructive bg-destructive/10 border-destructive/20',
      icon: <span className="text-[10px] font-bold">!</span>,
    },
    cancelled: {
      label: 'Cancelled',
      className: 'text-muted-foreground bg-muted/60 border-border/50',
      icon: <SquareIcon className="h-3 w-3" />,
    },
  } as const;

  const { label, className, icon } = config[status];

  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${className}`}
    >
      {icon}
      {label}
    </span>
  );
}
