import {
  Calculator,
  Calendar,
  CreditCard,
  Loader2Icon,
  Settings,
  Smile,
  User,
} from 'lucide-react';

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import { BookmarkNode, FlatBookmark } from '@/types/bookmarks';
import { flattenBookmarks } from '@/lib/utils';
import { sendMessage } from '@/messaging';

interface CommandDialogDemoProps {
  portalContainer?: HTMLElement;
}

export function CommandDialogDemo({ portalContainer }: CommandDialogDemoProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [bookmarks, setBookmarks] = useState<FlatBookmark[]>([]);

  useEffect(() => {
    const fetchBookmarks = async () => {
      setIsLoading(true);
      try {
        const result = await sendMessage('geetBookmarks');

        setBookmarks(flattenBookmarks(result || []));
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookmarks();
  }, []);

  return (
    <CommandDialog defaultOpen container={portalContainer}>
      <CommandInput placeholder="Type a command or search..." />
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
              {bookmarks.map((bookmark) => (
                <CommandItem key={bookmark.id}>
                  <Calculator />
                  <span>{bookmark.title}</span>
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
