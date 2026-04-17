import { CheckIcon, CopyIcon, TerminalIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '../ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

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

const codexReviewPrompt = ({ source, target }: BranchInfo) =>
  `$strict-review review branch ${source} against ${target}`;

const getSourceBranch = (doc: Document): string =>
  doc.querySelector<HTMLButtonElement>('.js-source-branch-copy')?.dataset
    .clipboardText ?? '';

const getTargetBranch = (doc: Document): string => {
  const refs = doc.querySelectorAll<HTMLAnchorElement>('.ref-container');
  return refs[1]?.title ?? '';
};

interface CodeReviewCommandsShortcutProps {
  container: HTMLElement | null;
}

export const CodeReviewCommandsShortcut = ({
  container,
}: CodeReviewCommandsShortcutProps) => {
  const [open, setOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [branchInfo, setBranchInfo] = useState({ target: '', source: '' });

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
        className="w-[min(420px,92vw)] rounded-2xl border-border/60 bg-background/98 p-0 shadow-xl"
      >
        <div className="border-b border-border/60 bg-muted/20 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">
                  Review Commands
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Copy the Git steps for this merge request.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 rounded-full border border-border/40 bg-background/80 px-2.5 py-1 font-mono text-[10px] text-muted-foreground">
              <span className="max-w-24 truncate text-foreground/70">
                {branchInfo.source}
              </span>
              <span>→</span>
              <span className="max-w-[72px] truncate">{branchInfo.target}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-b border-border/50 px-4 py-2.5">
          <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            {commands.length} steps
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                copy('codex-prompt', codexReviewPrompt(branchInfo))
              }
              className="inline-flex items-center gap-1.5 rounded-md border border-border/50 px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
            >
              {copiedId === 'codex-prompt' ? (
                <CheckIcon className="h-3 w-3 text-green-500" />
              ) : (
                <CopyIcon className="h-3 w-3" />
              )}
              {copiedId === 'codex-prompt' ? 'Copied!' : 'Copy Codex prompt'}
            </button>
            <button
              onClick={() => copy('all', allCommands(branchInfo))}
              className="inline-flex items-center gap-1.5 rounded-md border border-border/50 px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
            >
              {copiedId === 'all' ? (
                <CheckIcon className="h-3 w-3 text-green-500" />
              ) : (
                <CopyIcon className="h-3 w-3" />
              )}
              {copiedId === 'all' ? 'Copied!' : 'Copy all'}
            </button>
          </div>
        </div>

        <ul className="py-2">
          {commands.map((cmd, index) => {
            const resolved = resolveCommand(cmd, branchInfo);
            const isCopied = copiedId === cmd.id;
            return (
              <li key={cmd.id}>
                <button
                  onClick={() => copy(cmd.id, resolved)}
                  className="group flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/45"
                >
                  <span className="w-4 shrink-0 font-mono text-[10px] tabular-nums text-muted-foreground/60">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="block text-xs font-medium text-foreground">
                      {cmd.label}
                    </span>
                    <span className="block truncate text-[10px] text-muted-foreground">
                      {cmd.description}
                    </span>
                  </div>
                  <div className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100">
                    {isCopied ? (
                      <div className="flex items-center gap-1 text-[10px] font-medium text-green-600">
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
      </PopoverContent>
    </Popover>
  );
};
