import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import JiraIcon from '@/components/misc/JiraIcon';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import KeyboardShortcut from '@/components/ui/keyboard-shortcut';
import { TEAM_SLUGS } from '@/lib/constants';
import { getJiraTaskUrl } from '@/lib/utils';

interface JiraShortcutDialogProps {
  portalContainer: HTMLElement;
}

export default function JiraShortcutDialog({
  portalContainer,
}: JiraShortcutDialogProps) {
  const [input, setInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [suggestion, setSuggestion] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleOpenChange = useCallback((open: boolean) => {
    if (open) {
      setInput('');
      setSuggestion('');
      inputRef.current?.focus();
    }

    setIsOpen(open);
  }, []);

  useEffect(() => {
    if (!input) {
      setSuggestion('');
      return;
    }

    const upperInput = input.toUpperCase();
    const matchingSlug = TEAM_SLUGS.find(
      (slug) => slug.startsWith(upperInput) && slug !== upperInput,
    );

    if (matchingSlug) {
      setSuggestion(matchingSlug + '-');
    } else {
      setSuggestion('');
    }
  }, [input]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      const { key, metaKey, ctrlKey } = event;

      if (key === 'Escape') {
        setIsOpen(false);
        return;
      }

      if (key === 'Tab' && suggestion) {
        event.preventDefault();
        setInput(suggestion);
        setSuggestion('');
        return;
      }

      if (key !== 'Enter' || !input.trim()) return;

      event.preventDefault();
      const issueKey = input.trim().toUpperCase();
      const jiraUrl = getJiraTaskUrl(issueKey);

      if (metaKey || ctrlKey) {
        navigator.clipboard.writeText(jiraUrl);
        toast.success('Jira URL copied to clipboard');
      } else {
        window.open(jiraUrl, '_blank');
      }

      setIsOpen(false);
    },
    [input, suggestion],
  );

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setInput(event.target.value);
    },
    [],
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-lg p-2 gap-0"
        container={portalContainer}
      >
        <div className="flex flex-col min-h-[300px]">
          <div className="flex-1 p-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <JiraIcon />
              </div>
              <Input
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Enter Jira issue key (e.g., PRD-499)"
                className="text-lg md:text-lg h-12 pr-4 pl-8"
                autoComplete="off"
                spellCheck={false}
              />

              {suggestion && (
                <div className="absolute inset-0 flex items-center pointer-events-none">
                  <span className="text-lg text-transparent pl-8">{input}</span>
                  <span className="text-lg text-muted-foreground mt-[1px]">
                    {suggestion.slice(input.length)}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t">
              <p className="text-xs text-muted-foreground mb-2">
                Supported teams:
              </p>
              <div className="flex flex-wrap gap-1">
                {TEAM_SLUGS.map((slug) => (
                  <Badge
                    key={slug}
                    variant={
                      input.toUpperCase().startsWith(slug)
                        ? 'default'
                        : 'outline'
                    }
                    className={'px-2 py-1 rounded text-xs font-mono'}
                  >
                    {slug}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t bg-muted/30 px-4 py-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <KeyboardShortcut keyLabel="↵" />
                  <span className="text-muted-foreground">Open in Jira</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <div className="flex items-center gap-0.5">
                    <KeyboardShortcut keyLabel="⌘" />
                    <KeyboardShortcut keyLabel="↵" />
                  </div>
                  <span className="text-muted-foreground">Copy URL</span>
                </span>
                {suggestion && (
                  <span className="flex items-center gap-1.5">
                    <KeyboardShortcut keyLabel="Tab" />
                    <span className="text-muted-foreground">
                      Accept suggestion
                    </span>
                  </span>
                )}
              </div>
              <span className="flex items-center gap-1.5">
                <KeyboardShortcut keyLabel="Esc" />
                <span className="text-muted-foreground">Close</span>
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
