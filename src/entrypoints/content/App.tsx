import { BookmarkIcon, Loader2Icon, SearchIcon } from 'lucide-react';

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { useBookmarks } from '@/hooks/useBookmarks';
import { sendMessage } from '@/messaging';
import { FlatBookmark } from '@/types/bookmarks';

interface CommandDialogDemoProps {
  portalContainer?: HTMLElement;
}

export function CommandDialogDemo({ portalContainer }: CommandDialogDemoProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const { bookmarks, isLoading } = useBookmarks();

  const handleOpenBookmark = (bookmark: FlatBookmark) => {
    sendMessage('openBookmark', bookmark.url);
  };

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'j' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const filteredBookmarks = useMemo(() => {
    return bookmarks.filter((bookmark) =>
      bookmark.title.toLowerCase().includes(query.toLowerCase()),
    );
  }, [bookmarks, query]);

  return (
    <CommandDialog
      open={isOpen}
      onOpenChange={setIsOpen}
      container={portalContainer}
      className="lg:min-w-[600px]"
    >
      <div
        data-slot="command-input-wrapper"
        className="flex h-9 items-center gap-2 border-b px-3"
      >
        <SearchIcon className="size-4 shrink-0 opacity-50" />
        <input
          data-slot="command-input"
          className="placeholder:text-muted-foreground flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-hidden disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Type a command or search..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <CommandList>
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2Icon className="h-4 w-4 animate-spin" />
            <span className="ml-2 text-sm text-muted-foreground">
              Loading bookmarks...
            </span>
          </div>
        ) : (
          <>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Bookmarks">
              {filteredBookmarks.map((bookmark, index) => (
                <CommandItem
                  key={bookmark.id}
                  onSelect={() => {
                    handleOpenBookmark(bookmark);
                  }}
                >
                  <BookmarkIcon />
                  <span>{bookmark.title}</span>
                  {/* Small hack so that the command item can be focused even if the title is the same as another item's title */}
                  <span className="hidden">{index}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
        <CommandSeparator />
      </CommandList>
    </CommandDialog>
  );
}
