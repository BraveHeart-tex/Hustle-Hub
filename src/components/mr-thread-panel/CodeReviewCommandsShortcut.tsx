import { CheckIcon, TerminalIcon } from 'lucide-react';

import {
  renderTemplate,
  useStrictReviewTemplate,
} from '@/lib/storage/prompt-templates';

import { Button } from '../ui/button';

const getSourceBranch = (doc: Document): string =>
  doc.querySelector<HTMLButtonElement>('.js-source-branch-copy')?.dataset
    .clipboardText ?? '';

const getTargetBranch = (doc: Document): string => {
  const refs = doc.querySelectorAll<HTMLAnchorElement>('.ref-container');
  return refs[1]?.title ?? '';
};

export const CodeReviewCommandsShortcut = () => {
  const [copied, setCopied] = useState(false);
  const [branchInfo, setBranchInfo] = useState({ target: '', source: '' });
  const { template } = useStrictReviewTemplate();

  useEffect(() => {
    setBranchInfo({
      target: getTargetBranch(document),
      source: getSourceBranch(document),
    });
  }, []);

  const copyPrompt = () => {
    const text = renderTemplate(template, {
      source: branchInfo.source,
      target: branchInfo.target,
      url: window.location.href,
    });

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (!branchInfo.source || !branchInfo.target) return null;

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={copyPrompt}
      className="rounded-full shadow-sm gap-2 h-8 px-3 border-border/60 hover:border-border hover:bg-muted/50 transition-all"
    >
      {copied ? (
        <>
          <CheckIcon className="h-3.5 w-3.5 text-green-600" />
          <span className="text-xs font-medium">Copied</span>
        </>
      ) : (
        <>
          <TerminalIcon className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-medium">Copy Review Prompt</span>
        </>
      )}
    </Button>
  );
};
