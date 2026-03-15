import { BotIcon, CheckIcon, CopyIcon, TerminalIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { ENDPOINTS } from '@/lib/endpoints';
import { extractJiraId } from '@/lib/utils/misc/extractJiraId';

import { ReviewMarkdown } from '../ReviewMarkdown';
import { Button } from '../ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { ScrollArea } from '../ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

// --- existing commands config unchanged ---
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

// --- review types ---
type ReviewStatus = 'idle' | 'streaming' | 'done' | 'error' | 'cancelled';

// --- main component ---
interface CodeReviewCommandsShortcutProps {
  container: HTMLElement | null;
}

export const CodeReviewCommandsShortcut = ({
  container,
}: CodeReviewCommandsShortcutProps) => {
  const [open, setOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [branchInfo, setBranchInfo] = useState({ target: '', source: '' });

  // review state
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
          onClick={() => setOpen((prev) => !prev)}
          className="rounded-full shadow-sm gap-1.5 h-auto py-1.5"
        >
          <TerminalIcon className="h-3.5 w-3.5 shrink-0" />
          <div className="flex flex-col items-start leading-tight">
            <span className="text-xs">Review Tools</span>
            <span className="text-[10px] text-muted-foreground font-medium">
              Commands · AI
            </span>
          </div>
        </Button>
      </PopoverTrigger>

      <PopoverContent
        container={container}
        side="top"
        align="end"
        className="w-[min(780px,92vw)] p-0 overflow-hidden"
      >
        <Tabs defaultValue="commands">
          {/* Tab bar */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-b bg-muted/40">
            <TabsList className="h-7 p-0.5">
              <TabsTrigger
                value="commands"
                className="text-xs h-6 px-2.5 gap-1.5"
              >
                <TerminalIcon className="h-3 w-3" />
                Commands
              </TabsTrigger>
              <TabsTrigger
                value="review"
                className="text-xs h-6 px-2.5 gap-1.5"
              >
                <BotIcon className="h-3 w-3" />
                AI Review
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Commands tab — your existing UI unchanged */}
          <TabsContent value="commands" className="mt-0">
            <div className="flex items-center gap-2 px-3 py-2 border-b">
              <span className="text-xs text-muted-foreground ml-auto">
                {commands.length} steps
              </span>
              <button
                onClick={() => copy('all', allCommands(branchInfo))}
                className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
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
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-muted/60 transition-colors group"
                    >
                      <span className="text-[10px] font-mono text-muted-foreground w-4 shrink-0">
                        {index + 1}.
                      </span>
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="text-xs font-medium">{cmd.label}</span>
                        <span className="text-[10px] text-muted-foreground truncate">
                          {cmd.description}
                        </span>
                      </div>
                      <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        {isCopied ? (
                          <CheckIcon className="h-3.5 w-3.5 text-green-500" />
                        ) : (
                          <CopyIcon className="h-3.5 w-3.5 text-muted-foreground" />
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
            {/* Toolbar */}
            <div className="flex items-center gap-2 px-3 py-2 border-b">
              <ReviewStatusDot status={reviewStatus} />
              <span className="text-[10px] text-muted-foreground">
                {reviewStatus === 'streaming' && 'Reviewing...'}
                {reviewStatus === 'done' && 'Done'}
                {reviewStatus === 'error' && 'Something went wrong'}
                {reviewStatus === 'cancelled' && 'Cancelled'}
                {reviewStatus === 'idle' && 'Not started'}
              </span>
              <div className="ml-auto flex items-center gap-1">
                {reviewStatus === 'streaming' && (
                  <button
                    onClick={cancelReview}
                    className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Stop
                  </button>
                )}
                {reviewStatus !== 'streaming' && (
                  <button
                    onClick={runReview}
                    className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {reviewStatus === 'idle' ? 'Run review' : 'Re-run'}
                  </button>
                )}
              </div>
            </div>

            {/* Content */}
            <ScrollArea className="h-[min(640px,70vh)]">
              <div className="px-4 py-3 min-w-0 max-w-full overflow-hidden">
                {reviewStatus === 'idle' && (
                  <p className="text-xs text-muted-foreground">
                    Click &quot;Run review&quot; to start an AI review of this
                    MR.
                  </p>
                )}
                {reviewStatus === 'error' && (
                  <p className="text-xs text-destructive">
                    Review failed. Check your connection and try again.
                  </p>
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

function ReviewStatusDot({ status }: { status: ReviewStatus }) {
  const map: Record<ReviewStatus, string> = {
    idle: 'bg-muted-foreground/40',
    streaming: 'bg-blue-500 animate-pulse',
    done: 'bg-green-500',
    error: 'bg-destructive',
    cancelled: 'bg-muted-foreground/40',
  };
  return (
    <span className={`inline-block h-1.5 w-1.5 rounded-full ${map[status]}`} />
  );
}
