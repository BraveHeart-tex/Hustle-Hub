import {
  GitMergeIcon,
  GitPullRequestDraftIcon,
  SearchIcon,
} from 'lucide-react';
import { useState } from 'react';

import GitlabIcon from '@/components/misc/GitlabIcon';
import JiraIcon from '@/components/misc/JiraIcon';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { useWorkItemSearch } from '@/hooks/useWorkItemSearch';
import { cn } from '@/lib/utils';
import { type NoteLinkedWorkItem } from '@/types/notes';

interface NoteWorkItemPickerProps {
  open: boolean;
  linkedItems: NoteLinkedWorkItem[];
  onOpenChange: (open: boolean) => void;
  onSelect: (item: NoteLinkedWorkItem) => void;
}

const isLinked = (
  linkedItems: NoteLinkedWorkItem[],
  item: NoteLinkedWorkItem,
) =>
  linkedItems.some(
    (linkedItem) => linkedItem.type === item.type && linkedItem.id === item.id,
  );

const WorkItemRow = ({
  item,
  linked,
  onSelect,
}: {
  item: NoteLinkedWorkItem;
  linked: boolean;
  onSelect: () => void;
}) => {
  const isGitlab = item.type === 'gitlab';

  return (
    <CommandItem
      value={`${item.type} ${item.key ?? item.id} ${item.title} ${
        item.projectName ?? ''
      } ${item.status ?? ''}`}
      className={cn(
        'group flex items-start gap-3 px-3 py-2.5 cursor-pointer',
        linked && 'opacity-60',
      )}
      onSelect={onSelect}
    >
      <div className="mt-0.5 shrink-0">
        {isGitlab ? (
          item.draft ? (
            <GitPullRequestDraftIcon
              size={14}
              className="text-muted-foreground/60"
            />
          ) : (
            <GitMergeIcon size={14} className="text-emerald-500/80" />
          )
        ) : (
          <span className="mt-1.5 block h-1.5 w-1.5 rounded-full bg-blue-400/70" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
            {item.key ?? item.id}
          </span>
          {item.status && (
            <span className="shrink-0 rounded-full border border-border bg-muted px-1.5 py-px text-[10px] text-muted-foreground">
              {item.status}
            </span>
          )}
          {linked && (
            <span className="shrink-0 rounded-full border border-border px-1.5 py-px text-[10px] text-muted-foreground">
              Linked
            </span>
          )}
        </div>
        <p className="mt-0.5 truncate text-sm font-medium">{item.title}</p>
        {item.projectName && (
          <p className="mt-1 truncate text-[11px] text-muted-foreground">
            {item.projectName}
          </p>
        )}
      </div>
    </CommandItem>
  );
};

const NoteWorkItemPicker = ({
  open,
  linkedItems,
  onOpenChange,
  onSelect,
}: NoteWorkItemPickerProps) => {
  const [query, setQuery] = useState('');
  const { gitlab, jira, isLoading, isError } = useWorkItemSearch(query);
  const hasResults = gitlab.length > 0 || jira.length > 0;

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      setQuery('');
    }
  };

  const handleSelect = (item: NoteLinkedWorkItem) => {
    onSelect(item);
    handleOpenChange(false);
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={handleOpenChange}
      className="lg:min-w-[560px] overflow-hidden"
      title="Link work item"
      description="Search Jira tickets and GitLab merge requests to link to this note."
      showCloseButton={false}
    >
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder="Search Jira tickets or GitLab MRs..."
        autoFocus
      />
      <CommandList className="max-h-[420px] overflow-y-auto py-1.5">
        {!hasResults && (
          <CommandEmpty>
            <div className="flex flex-col items-center gap-1.5 py-8 text-center">
              <SearchIcon size={20} className="text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                {isLoading
                  ? 'Loading work items...'
                  : isError
                    ? 'Could not load work items.'
                    : query
                      ? `No results for "${query}"`
                      : 'Start typing to search...'}
              </p>
            </div>
          </CommandEmpty>
        )}

        {gitlab.length > 0 && (
          <CommandGroup
            heading={
              <div className="flex items-center gap-1.5">
                <GitlabIcon className="h-3 w-3" />
                <span>Merge Requests</span>
                <span className="ml-auto text-[10px] font-normal text-muted-foreground/50">
                  {gitlab.length}
                </span>
              </div>
            }
          >
            {gitlab.map((item) => (
              <WorkItemRow
                key={`${item.type}-${item.id}`}
                item={item}
                linked={isLinked(linkedItems, item)}
                onSelect={() => handleSelect(item)}
              />
            ))}
          </CommandGroup>
        )}

        {gitlab.length > 0 && jira.length > 0 && (
          <CommandSeparator className="my-1" />
        )}

        {jira.length > 0 && (
          <CommandGroup
            heading={
              <div className="flex items-center gap-1.5">
                <JiraIcon className="h-3 w-3 text-blue-500" />
                <span>Jira Tickets</span>
                <span className="ml-auto text-[10px] font-normal text-muted-foreground/50">
                  {jira.length}
                </span>
              </div>
            }
          >
            {jira.map((item) => (
              <WorkItemRow
                key={`${item.type}-${item.id}`}
                item={item}
                linked={isLinked(linkedItems, item)}
                onSelect={() => handleSelect(item)}
              />
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
};

export default NoteWorkItemPicker;
