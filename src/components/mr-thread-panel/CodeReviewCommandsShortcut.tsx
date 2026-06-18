import { CheckIcon, ChevronDownIcon, TerminalIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  pickTemplateForUrl,
  renderTemplate,
  useStrictReviewTemplates,
} from '@/lib/storage/prompt-templates';
import { cn } from '@/lib/utils';

const getSourceBranch = (doc: Document): string =>
  doc.querySelector<HTMLButtonElement>('.js-source-branch-copy')?.dataset
    .clipboardText ?? '';

const getTargetBranch = (doc: Document): string => {
  const refs = doc.querySelectorAll<HTMLAnchorElement>('.ref-container');
  return refs[1]?.title ?? '';
};

export const CodeReviewCommandsShortcut = ({
  container,
}: {
  container: HTMLElement;
}) => {
  const [copied, setCopied] = useState(false);
  const [branchInfo, setBranchInfo] = useState({ target: '', source: '' });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const { templates } = useStrictReviewTemplates();

  useEffect(() => {
    setBranchInfo({
      target: getTargetBranch(document),
      source: getSourceBranch(document),
    });
  }, []);

  const autoTemplate = pickTemplateForUrl(templates, window.location.href);
  const selectedTemplate =
    templates.find((item) => item.id === selectedId) ?? autoTemplate;

  const copyPrompt = () => {
    if (!selectedTemplate) return;

    const text = renderTemplate(selectedTemplate.template, {
      source: branchInfo.source,
      target: branchInfo.target,
      url: window.location.href,
    });

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (!branchInfo.source || !branchInfo.target) return null;
  if (!selectedTemplate) return null;

  return (
    <div className="flex items-center gap-1">
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

      {templates.length > 1 && (
        <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
          <PopoverTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              className="rounded-full shadow-sm h-8 px-2 border-border/60 hover:border-border hover:bg-muted/50 transition-all"
              title={`Template: ${selectedTemplate.name}`}
            >
              <ChevronDownIcon className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            className="w-56 p-1"
            container={container}
          >
            <p className="px-2 py-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Review template
            </p>
            {templates.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setSelectedId(item.id);
                  setPickerOpen(false);
                }}
                className={cn(
                  'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-xs transition-colors hover:bg-muted/60',
                  item.id === selectedTemplate.id && 'bg-muted/40',
                )}
              >
                <CheckIcon
                  className={cn(
                    'h-3.5 w-3.5 shrink-0',
                    item.id === selectedTemplate.id
                      ? 'opacity-100'
                      : 'opacity-0',
                  )}
                />
                <span className="truncate">{item.name}</span>
                {item.id === autoTemplate?.id && (
                  <span className="ml-auto text-[10px] text-muted-foreground">
                    auto
                  </span>
                )}
              </button>
            ))}
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
};
