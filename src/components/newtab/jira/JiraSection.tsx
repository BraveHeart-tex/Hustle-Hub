import { toast } from 'sonner';

import JiraIcon from '@/components/misc/JiraIcon';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { onMessage, sendMessage } from '@/messaging';

export default function JiraSection() {
  const handleAuthorize = () => {
    sendMessage('authorizeJira');
  };

  useEffect(() => {
    const unsubscribe = onMessage('jiraOAuthCallback', (message) => {
      if (message.data.status === 'success') {
        toast.success('Jira authorized successfully');
      }
      if (message.data.status === 'error') {
        toast.error('Jira authorization failed');
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <JiraIcon className="h-5 w-5 text-blue-500" />
          Jira Tickets
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button onClick={handleAuthorize}>Authorize</Button>
      </CardContent>
    </Card>
  );
}
