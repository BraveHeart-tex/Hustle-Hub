import { useQueryClient } from '@tanstack/react-query';
import { SearchIcon } from 'lucide-react';
import { useState } from 'react';

import GitlabIcon from '@/components/misc/GitlabIcon';
import GoogleWorkspaceIcon from '@/components/misc/GoogleWorkspaceIcon';
import JiraIcon from '@/components/misc/JiraIcon';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { QUERY_KEYS } from '@/lib/constants';
import { formatEventStartAndEnd, getJiraTaskUrl, safeKeys } from '@/lib/utils';
import { GitlabMergeRequest } from '@/types/gitlab';
import {
  GoogleCalendarEvent,
  GoogleCalendarEventsResponse,
} from '@/types/google';
import { JiraIssue } from '@/types/jira';

interface GroupedData {
  calendar: GoogleCalendarEvent[];
  gitlab: GitlabMergeRequest[];
  jira: JiraIssue[];
}

const SearchDialog = () => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<GroupedData>({
    calendar: [],
    gitlab: [],
    jira: [],
  });
  const queryClient = useQueryClient();

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

  useEffect(() => {
    if (!isOpen) return;

    const groupedData: GroupedData = {
      calendar: [],
      gitlab: [],
      jira: [],
    };

    const getSafeQueryData = <T,>(
      key: readonly unknown[],
      fallback: Partial<T>,
    ): T => {
      return queryClient.getQueryData<T>(key) || (fallback as T);
    };

    const calendarData = getSafeQueryData<GoogleCalendarEventsResponse>(
      QUERY_KEYS.CALENDAR_EVENTS,
      { items: [] },
    );
    groupedData.calendar.push(...calendarData.items);

    const gitlabKeys = ['assigned', 'review'] as const;
    gitlabKeys.forEach((key) => {
      const data = getSafeQueryData<{ data: GitlabMergeRequest[] }>(
        QUERY_KEYS.GITLAB_MRS(key),
        { data: [] },
      );
      groupedData.gitlab.push(...data.data);
    });

    const jiraKeys = ['for_you', 'literally_working_on'] as const;
    jiraKeys.forEach((key) => {
      const data = getSafeQueryData<{ issues: JiraIssue[] }>(
        QUERY_KEYS.JIRA_ISSUES(key),
        { issues: [] },
      );
      groupedData.jira.push(...data.issues);
    });

    setData(groupedData);
  }, [queryClient, isOpen]);

  return (
    <CommandDialog
      open={isOpen}
      onOpenChange={setIsOpen}
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
        <CommandEmpty>No results found.</CommandEmpty>
        {(safeKeys(data) as (keyof GroupedData)[]).map((group) => {
          if (group === 'calendar' && data.calendar.length > 0) {
            return (
              <CommandGroup heading="Calendar" key={`command-group-${group}`}>
                {data.calendar
                  .filter((event) =>
                    event.summary
                      ?.toLocaleLowerCase()
                      ?.includes(query.toLocaleLowerCase()),
                  )
                  .map((event) => (
                    <CommandItem
                      key={event.id}
                      onSelect={() => {
                        window.open(
                          event.htmlLink,
                          '_blank',
                          'noopener,noreferrer',
                        );
                      }}
                    >
                      <GoogleWorkspaceIcon className="h-4 w-4" />
                      <span className="font-semibold">{event.summary}</span>
                      <span className="text-xs">
                        (
                        {formatEventStartAndEnd(
                          event.start.dateTime,
                          event.end.dateTime,
                        )}
                        )
                      </span>
                    </CommandItem>
                  ))}
              </CommandGroup>
            );
          }

          if (group === 'gitlab' && data.gitlab.length > 0) {
            return (
              <CommandGroup heading="GitLab" key={`command-group-${group}`}>
                {data.gitlab
                  .filter((mr) =>
                    mr.title.toLowerCase().includes(query.toLowerCase()),
                  )
                  .map((mr) => (
                    <CommandItem
                      key={mr.iid}
                      onSelect={() => {
                        window.open(mr.webUrl, '_blank', 'noopener,noreferrer');
                      }}
                    >
                      <GitlabIcon className="h-4 w-4" />
                      <span>{mr.title}</span>
                    </CommandItem>
                  ))}
              </CommandGroup>
            );
          }

          if (group === 'jira' && data.jira.length > 0) {
            return (
              <CommandGroup heading="Jira" key={`command-group-${group}`}>
                {data.jira
                  .filter(
                    (issue) =>
                      issue.fields.summary
                        .toLocaleLowerCase()
                        .includes(query.toLocaleLowerCase()) ||
                      issue.key.toLowerCase().includes(query.toLowerCase()),
                  )
                  .map((issue) => (
                    <CommandItem
                      key={issue.key}
                      onSelect={() =>
                        window.open(getJiraTaskUrl(issue.key), '_blank')
                      }
                    >
                      <div className="flex items-center w-full justify-between">
                        <div className="flex items-center gap-2 truncate">
                          <JiraIcon className="h-4 w-4 text-blue-500" />
                          <span className="font-medium">{issue.key}</span>
                          <span className="text-muted-foreground truncate max-w-[400px]">
                            {issue.fields.summary}
                          </span>
                        </div>

                        <span className="ml-4 text-xs rounded-full px-2 py-0.5 bg-muted/50 text-muted-foreground font-semibold">
                          {issue.fields.status.name}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
              </CommandGroup>
            );
          }

          return null;
        })}
        <CommandSeparator />
      </CommandList>
    </CommandDialog>
  );
};

export default SearchDialog;
