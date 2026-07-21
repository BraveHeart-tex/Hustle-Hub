import {
  AlertTriangleIcon,
  CheckIcon,
  ChevronDownIcon,
  Loader2Icon,
  TerminalIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { ClaudeIcon } from '@/components/misc/ClaudeIcon';
import { SEGMENT_CLASS } from '@/components/mr-thread-panel/segment';
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

  // Launch state lives only in the button label and a `title`; mirror it into a
  // polite live region so screen readers hear the outcome (including the error
  // message, which the tooltip alone would never announce).
  const launchAnnouncement =
    launchState.status === 'launching'
      ? 'Launching Claude Code'
      : launchState.status === 'launched'
        ? 'Claude Code launched'
        : launchState.status === 'error'
          ? `Launch failed: ${launchState.message}`
          : '';

  return (
    <>
      <Button
        size="sm"
        variant="ghost"
        onClick={copyPrompt}
        title="Copy review prompt"
        className={SEGMENT_CLASS}
      >
        {copied ? (
          <>
            <CheckIcon className="h-3.5 w-3.5 text-success" />
            <span className="text-xs font-medium sr-only md:not-sr-only">
              Copied
            </span>
          </>
        ) : (
          <>
            <TerminalIcon className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium sr-only md:not-sr-only">
              Copy Review Prompt
            </span>
          </>
        )}
      </Button>

      {/* The one primary action. Signal Ink fill marks the dominant control
          (DESIGN "One Active Voice"); state icons inherit the button
          foreground, and the error state flips the whole segment to
          destructive so contrast holds in both themes. */}
      <Button
        size="sm"
        variant="default"
        onClick={launchClaude}
        disabled={launchState.status === 'launching'}
        title={
          launchState.status === 'error' ? launchState.message : 'Launch Claude'
        }
        className={cn(
          SEGMENT_CLASS,
          launchState.status === 'error' &&
            'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        )}
      >
        {launchState.status === 'launching' && (
          <>
            <Loader2Icon
              aria-hidden="true"
              className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none"
            />
            <span className="text-xs font-medium sr-only md:not-sr-only">
              Launching
            </span>
          </>
        )}
        {launchState.status === 'launched' && (
          <>
            <CheckIcon className="h-3.5 w-3.5" />
            <span className="text-xs font-medium sr-only md:not-sr-only">
              Launched
            </span>
          </>
        )}
        {launchState.status === 'error' && (
          <>
            <AlertTriangleIcon className="h-3.5 w-3.5" />
            <span className="text-xs font-medium sr-only md:not-sr-only">
              Failed
            </span>
          </>
        )}
        {launchState.status === 'idle' && (
          <>
            <ClaudeIcon />
            <span className="text-xs font-medium sr-only md:not-sr-only">
              Launch Claude
            </span>
          </>
        )}
      </Button>

      {templates.length > 1 && (
        <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
          <PopoverTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className={SEGMENT_CLASS}
              aria-label={`Change review template (current: ${selectedTemplate.name})`}
              title={`Template: ${selectedTemplate.name}`}
            >
              <ChevronDownIcon
                aria-hidden="true"
                className="h-3.5 w-3.5 text-muted-foreground"
              />
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
                aria-current={item.id === selectedTemplate.id}
                className={cn(
                  'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-xs transition-colors motion-reduce:transition-none hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50',
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

      <span role="status" aria-live="polite" className="sr-only">
        {launchAnnouncement}
      </span>
    </>
  );
};
