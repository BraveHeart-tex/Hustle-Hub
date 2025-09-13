import { ClipboardListIcon, TargetIcon } from 'lucide-react';

import JiraIcon from '@/components/misc/JiraIcon';
import JiraItem from '@/components/newtab/jira/JiraItem';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useJiraTickets } from '@/hooks/useJiraTickets';
import { JIRA_FILTERS, JiraFilter } from '@/lib/constants';

export default function JiraSection() {
  const [filter, setFilter] = useState<JiraFilter>(
    JIRA_FILTERS.LITERALLY_WORKING_ON,
  );
  const { issues, isLoading, isError, errorMessage } = useJiraTickets(filter);

  const renderContent = useCallback(() => {
    if (isLoading) {
      return (
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-4 animate-pulse">
              <CardContent>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (isError) {
      return <p className="text-destructive font-medium">{errorMessage}</p>;
    }

    if (issues.length === 0) {
      return <p className="text-muted-foreground">No issues found.</p>;
    }

    return issues.map((issue) => <JiraItem key={issue.id} issue={issue} />);
  }, [errorMessage, isError, isLoading, issues]);

  const toggleFilterType = () => {
    setFilter((prev) =>
      prev === JIRA_FILTERS.LITERALLY_WORKING_ON
        ? JIRA_FILTERS.FOR_YOU
        : JIRA_FILTERS.LITERALLY_WORKING_ON,
    );
  };

  return (
    <Card className="max-h-[calc(100vh-110px)] flex flex-col">
      <CardHeader className="pb-3 shrink-0">
        <CardTitle className="w-full flex items-center justify-between">
          <div className="flex items-center gap-2 text-lg">
            <JiraIcon className="h-5 w-5 text-blue-500" />
            Jira Tickets
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={toggleFilterType}
            disabled={isLoading}
          >
            {filter === JIRA_FILTERS.LITERALLY_WORKING_ON ? (
              <ClipboardListIcon />
            ) : (
              <TargetIcon />
            )}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto space-y-3">
        {renderContent()}
      </CardContent>
    </Card>
  );
}
