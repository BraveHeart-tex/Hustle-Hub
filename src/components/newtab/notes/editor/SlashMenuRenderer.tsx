import {
  Code2Icon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  Heading4Icon,
  ListIcon,
  ListOrderedIcon,
  ListTodoIcon,
  type LucideIcon,
  MinusIcon,
  QuoteIcon,
} from 'lucide-react';
import {
  forwardRef,
  type MouseEvent,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react';

import { cn } from '@/lib/utils';

import { type SlashMenuItem } from './SlashMenuItem';

const ICON_MAP: Record<string, LucideIcon> = {
  'Heading 1': Heading1Icon,
  'Heading 2': Heading2Icon,
  'Heading 3': Heading3Icon,
  'Heading 4': Heading4Icon,
  'Bullet List': ListIcon,
  'Numbered List': ListOrderedIcon,
  'Todo List': ListTodoIcon,
  Blockquote: QuoteIcon,
  'Code Block': Code2Icon,
  Divider: MinusIcon,
};

export interface SlashMenuRendererProps {
  items: SlashMenuItem[];
  command: (item: SlashMenuItem) => void;
}

export interface SlashMenuRendererRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

const SlashMenuRenderer = forwardRef<
  SlashMenuRendererRef,
  SlashMenuRendererProps
>(({ items, command }, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    setSelectedIndex(0);
  }, [items]);

  const selectItem = (index: number) => {
    const item = items[index];
    if (item) {
      command(item);
    }
  };

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === 'ArrowDown') {
        setSelectedIndex((selected) =>
          items.length === 0 ? 0 : (selected + 1) % items.length,
        );
        return true;
      }

      if (event.key === 'ArrowUp') {
        setSelectedIndex((selected) =>
          items.length === 0 ? 0 : (selected + items.length - 1) % items.length,
        );
        return true;
      }

      if (event.key === 'Enter') {
        selectItem(selectedIndex);
        return true;
      }

      if (event.key === 'Escape') {
        return false;
      }

      return false;
    },
  }));

  return (
    <div className="z-50 min-w-[220px] overflow-hidden rounded-lg border border-border bg-popover p-1 shadow-md">
      {items.length === 0 && (
        <p className="px-2 py-1.5 text-sm text-muted-foreground">No results</p>
      )}

      {items.map((item, index) => {
        const Icon = ICON_MAP[item.title] ?? ListIcon;

        return (
          <button
            key={item.title}
            type="button"
            onClick={() => command(item)}
            onMouseDown={(event: MouseEvent<HTMLButtonElement>) => {
              event.preventDefault();
            }}
            className={cn(
              'flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left text-sm',
              'hover:bg-accent hover:text-accent-foreground',
              index === selectedIndex && 'bg-accent text-accent-foreground',
            )}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-foreground">
              <Icon className="h-4 w-4" />
            </span>
            <div>
              <p className="font-medium leading-none">{item.title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {item.description}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
});

SlashMenuRenderer.displayName = 'SlashMenuRenderer';

export default SlashMenuRenderer;
