import { CheckIcon, CopyIcon, TerminalIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '../ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

interface BranchInfo {
  source: string;
  target: string;
}

const codexReviewPrompt = ({ source, target }: BranchInfo) => {
  return `$strict-review Run strict-review on ${window.location.href}.

Source branch: ${source}
Target branch: ${target}
Scope: full diff from ${source} into ${target}
Read existing MR discussions and dedupe.
Do not fetch Jira.
Output Turkish findings with severity, confidence, file:line, impact, and next step.`;
};

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
  const [copied, setCopied] = useState(false);
  const [branchInfo, setBranchInfo] = useState({ target: '', source: '' });

  useEffect(() => {
    setBranchInfo({
      target: getTargetBranch(document),
      source: getSourceBranch(document),
    });
  }, [container]);

  const copyCodexPrompt = () => {
    const text = codexReviewPrompt(branchInfo);

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
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
          <span className="text-xs font-medium">Strict Review</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent
        container={container}
        side="top"
        align="end"
        sideOffset={8}
        className="w-[min(360px,92vw)] rounded-2xl border-border/60 bg-background/98 p-0 shadow-xl"
      >
        <div className="border-b border-border/60 bg-muted/20 px-4 py-3">
          <div className="flex items-center gap-1.5 rounded-full border border-border/40 bg-background/80 px-2.5 py-1 font-mono text-[10px] text-muted-foreground justify-center">
            <span className="text-foreground/70">{branchInfo.source}</span>
            <span>→</span>
            <span>{branchInfo.target}</span>
          </div>
        </div>

        <div className="p-3">
          <button
            onClick={copyCodexPrompt}
            className="flex w-full items-center justify-between gap-3 rounded-lg border border-border/50 px-3 py-2.5 text-left transition-colors hover:bg-muted/45"
          >
            <span className="min-w-0">
              <span className="block text-xs font-medium text-foreground">
                Codex strict-review prompt
              </span>
              <span className="block truncate text-[10px] text-muted-foreground">
                Includes branch scope and current MR URL.
              </span>
            </span>
            <span className="shrink-0">
              {copied ? (
                <span className="flex items-center gap-1 text-[10px] font-medium text-green-600">
                  <CheckIcon className="h-3 w-3" />
                  Copied
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <CopyIcon className="h-3 w-3" />
                  Copy
                </span>
              )}
            </span>
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
