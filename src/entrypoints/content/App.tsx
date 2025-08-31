import { Calculator, Loader2Icon } from 'lucide-react';

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { useBookmarks } from '@/hooks/useBookmarks';

interface CommandDialogDemoProps {
  portalContainer?: HTMLElement;
}

export function CommandDialogDemo({ portalContainer }: CommandDialogDemoProps) {
  const { bookmarks, isLoading } = useBookmarks();

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
