import { CircleHelpIcon } from 'lucide-react';

import { KeyboardShortcutKey } from '@/components/newtab/KeyboardShortcutKey';
import {
  GITLAB_CATEGORY_SHORTCUTS,
  JIRA_FILTER_SHORTCUTS,
  SEARCH_SHORTCUT,
} from '@/components/newtab/keyboardShortcuts';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface ShortcutRowProps {
  keys: readonly string[];
  label: string;
}

function ShortcutRow({ keys, label }: ShortcutRowProps) {
  return (
    <li className="flex items-center justify-between gap-4 py-1.5">
      <span className="text-sm text-foreground">{label}</span>
      <span className="flex shrink-0 items-center gap-1">
        {keys.map((key) => (
          <KeyboardShortcutKey key={key}>{key}</KeyboardShortcutKey>
        ))}
      </span>
    </li>
  );
}

export function KeyboardShortcutsHelp() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Keyboard shortcuts"
          title="Keyboard shortcuts"
        >
          <CircleHelpIcon aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-80 p-0"
        aria-label="Keyboard shortcuts"
      >
        <div className="border-b border-border px-3 py-2.5">
          <h2 className="text-sm font-semibold">Keyboard shortcuts</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Two-key shortcuts work in sequence: press the first key, then the
            second.
          </p>
        </div>
        <div className="px-3 py-2">
          <ul>
            <ShortcutRow label="Search work" keys={SEARCH_SHORTCUT.keys} />
          </ul>
          <h3 className="mt-2 border-t border-border pt-3 text-xs font-medium text-muted-foreground">
            Dashboard filters
          </h3>
          <ul className="mt-1">
            {GITLAB_CATEGORY_SHORTCUTS.map((shortcut) => (
              <ShortcutRow
                key={shortcut.value}
                label={`GitLab: ${shortcut.label}`}
                keys={shortcut.shortcutKeys}
              />
            ))}
            {JIRA_FILTER_SHORTCUTS.map((shortcut) => (
              <ShortcutRow
                key={shortcut.value}
                label={`Jira: ${shortcut.label}`}
                keys={shortcut.shortcutKeys}
              />
            ))}
          </ul>
        </div>
      </PopoverContent>
    </Popover>
  );
}
