import { CheckIcon, CopyIcon, TerminalIcon } from 'lucide-react';
import { useState } from 'react';

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
    command: ({ target }) => `git pull origin ${target}`,
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
    command: ({ source }) => `git pull origin ${source}`,
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
  // second ref-container is the target branch (after "into")
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
  const [branchInfo, setBranchInfo] = useState({
    target: '',
    source: '',
  });

  useEffect(() => {
    const target = getTargetBranch(document);
    const source = getSourceBranch(document);
    setBranchInfo({ target, source });
  }, [container]);

  const copy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  if (!branchInfo.source || !branchInfo.target) {
    return null;
  }

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
            <span className="text-xs">Review Commands</span>
            <span className="text-[10px] text-muted-foreground font-medium">
              {commands.length} steps
            </span>
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        container={container}
        side="top"
        align="end"
        className="w-80 p-0 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center gap-2 px-3 py-2.5 border-b bg-muted/40">
          <TerminalIcon className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-sm font-medium">Review Commands</span>
          <button
            onClick={() => copy('all', allCommands(branchInfo))}
            className="ml-auto flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
          >
            {copiedId === 'all' ? (
              <CheckIcon className="h-3 w-3 text-green-500" />
            ) : (
              <CopyIcon className="h-3 w-3" />
            )}
            {copiedId === 'all' ? 'Copied!' : 'Copy all'}
          </button>
        </div>

        {/* Command list */}
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
      </PopoverContent>
    </Popover>
  );
};
