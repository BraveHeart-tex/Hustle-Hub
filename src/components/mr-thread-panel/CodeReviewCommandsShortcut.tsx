import {
  AlertTriangleIcon,
  BotIcon,
  CheckIcon,
  ChevronDownIcon,
  Loader2Icon,
  TerminalIcon,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { sendMessage } from '@/lib/messaging';
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

// GitLab MR URL: https://gitlab.com/<group>/<subgroup>/<project>/-/merge_requests/123
// The project slug is everything before `/-/merge_requests`.
const getProjectSlug = (href: string): string => {
  const { pathname } = new URL(href);
  const beforeMr = pathname.split('/-/merge_requests')[0];
  return beforeMr.replace(/^\/+/, '').replace(/\/+$/, '');
};

type LaunchState =
  | { status: 'idle' }
  | { status: 'launching' }
  | { status: 'launched' }
  | { status: 'error'; message: string };

// Chrome throws this when the receiving background is gone - almost always an
// orphaned content script left behind after the extension was reloaded.
const isNoReceiverError = (error: unknown): boolean => {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes('Receiving end does not exist') ||
    message.includes('Extension context invalidated') ||
    message.includes('message port closed')
  );
};

const toLaunchErrorMessage = (error: unknown): string => {
  if (isNoReceiverError(error)) {
    return 'Extension was updated - reload this page and try again';
  }

  return error instanceof Error
    ? error.message
    : 'Could not launch Claude Code';
};

export const CodeReviewCommandsShortcut = ({
  container,
  jiraId,
}: {
  container: HTMLElement;
  jiraId?: string;
}) => {
  const [copied, setCopied] = useState(false);
  const [launchState, setLaunchState] = useState<LaunchState>({
    status: 'idle',
  });
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

  const launchClaude = async (): Promise<void> => {
    if (!selectedTemplate) return;

    const prompt = renderTemplate(selectedTemplate.template, {
      source: branchInfo.source,
      target: branchInfo.target,
      url: window.location.href,
    });

    const payload = {
      slug: getProjectSlug(window.location.href),
      prompt,
      permissionMode: 'plan' as const,
      jiraId,
    };

    setLaunchState({ status: 'launching' });

    try {
      let response;

      try {
        response = await sendMessage('launchClaude', payload);
      } catch (error) {
        // A dormant service worker can miss the first message while waking up.
        // One retry covers that race; a truly orphaned script fails both times.
        if (!isNoReceiverError(error)) throw error;
        response = await sendMessage('launchClaude', payload);
      }

      if (!response.ok) {
        console.error('[launchClaude] native host failed:', response.error, {
          slug: payload.slug,
        });
        setLaunchState({
          status: 'error',
          message: response.error ?? 'Could not launch Claude Code',
        });
        setTimeout(() => setLaunchState({ status: 'idle' }), 4000);
        return;
      }

      setLaunchState({ status: 'launched' });
      setTimeout(() => setLaunchState({ status: 'idle' }), 1500);
    } catch (error) {
      console.error('[launchClaude] messaging failed:', error, {
        slug: payload.slug,
      });
      setLaunchState({
        status: 'error',
        message: toLaunchErrorMessage(error),
      });
      setTimeout(() => setLaunchState({ status: 'idle' }), 4000);
    }
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

      <Button
        size="sm"
        variant="outline"
        onClick={launchClaude}
        disabled={launchState.status === 'launching'}
        title={
          launchState.status === 'error' ? launchState.message : 'Launch Claude'
        }
        className={cn(
          'rounded-full shadow-sm gap-2 h-8 px-3 border-border/60 hover:border-border hover:bg-muted/50 transition-all',
          launchState.status === 'error' &&
            'border-red-500/60 text-red-600 hover:border-red-500',
        )}
      >
        {launchState.status === 'launching' && (
          <>
            <Loader2Icon className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
            <span className="text-xs font-medium">Launching</span>
          </>
        )}
        {launchState.status === 'launched' && (
          <>
            <CheckIcon className="h-3.5 w-3.5 text-green-600" />
            <span className="text-xs font-medium">Launched</span>
          </>
        )}
        {launchState.status === 'error' && (
          <>
            <AlertTriangleIcon className="h-3.5 w-3.5 text-red-600" />
            <span className="text-xs font-medium">Failed</span>
          </>
        )}
        {launchState.status === 'idle' && (
          <>
            <BotIcon className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium">Launch Claude</span>
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
            <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
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
