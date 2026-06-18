import {
  Code2Icon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  Heading4Icon,
  LinkIcon,
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
  useMemo,
  useRef,
  useState,
} from 'react';

import { type SlashMenuItem } from '@/components/newtab/notes/editor/SlashMenuItem';
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

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
  'Work Item': LinkIcon,
};

export interface SlashMenuRendererProps {
  items: SlashMenuItem[];
  clientRect?: (() => DOMRect | null) | null;
  command: (item: SlashMenuItem) => void;
}

export interface SlashMenuRendererRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

export const SlashMenuRenderer = forwardRef<
  SlashMenuRendererRef,
  SlashMenuRendererProps
>(({ items, clientRect, command }, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedIndexRef = useRef(0);
  const selectedItemRef = useRef<HTMLButtonElement | null>(null);
  const virtualRef = useMemo(
    () => ({
      current: {
        getBoundingClientRect: () => clientRect?.() ?? new DOMRect(),
      },
    }),
    [clientRect],
  );

  useEffect(() => {
    selectedIndexRef.current = 0;
    setSelectedIndex(0);
  }, [items]);

  useEffect(() => {
    selectedItemRef.current?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  const selectItem = (index: number) => {
    const item = items[index];
    if (item) {
      command(item);
    }
  };

  const moveSelection = (nextIndex: number) => {
    selectedIndexRef.current = nextIndex;
    setSelectedIndex(nextIndex);
  };

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        event.stopPropagation();
        moveSelection(
          items.length === 0
            ? 0
            : (selectedIndexRef.current + 1) % items.length,
        );
        return true;
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        event.stopPropagation();
        moveSelection(
          items.length === 0
            ? 0
            : (selectedIndexRef.current + items.length - 1) % items.length,
        );
        return true;
      }

      if (event.key === 'Enter') {
        event.preventDefault();
        event.stopPropagation();
        selectItem(selectedIndexRef.current);
        return true;
      }

      if (event.key === 'Escape') {
        return false;
      }

      return false;
    },
  }));

  return (
    <Popover open>
      <PopoverAnchor virtualRef={virtualRef} />
      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={6}
        collisionPadding={12}
        onOpenAutoFocus={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => event.preventDefault()}
        className="w-72 overflow-hidden p-1"
      >
        <div
          role="listbox"
          className="max-h-[min(320px,var(--radix-popover-content-available-height))] overflow-y-auto"
        >
          {items.length === 0 && (
            <p className="px-2 py-1.5 text-sm text-muted-foreground">
              No results
            </p>
          )}

          {items.map((item, index) => {
            const Icon = ICON_MAP[item.title] ?? ListIcon;

            return (
              <button
                ref={index === selectedIndex ? selectedItemRef : null}
                key={item.title}
                type="button"
                role="option"
                aria-selected={index === selectedIndex}
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
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-background text-foreground">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="font-medium leading-none">{item.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
});

SlashMenuRenderer.displayName = 'SlashMenuRenderer';
