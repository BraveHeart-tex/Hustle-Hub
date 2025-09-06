import { toast } from 'sonner';

import GitlabIcon from '@/components/misc/GitlabIcon';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { onMessage, sendMessage } from '@/messaging';

export default function GitlabSection() {
  const handleAuthorize = () => {
    sendMessage('authorizeGitlab');
  };

  useEffect(() => {
    const unsubscribe = onMessage('gitlabOAuthCallback', (message) => {
      if (message.data.status === 'error') {
        toast.error('Gitlab authorization failed.');
        return;
      }

      toast.success('Gitlab authorization is successful.');
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <GitlabIcon className="h-5 w-5" />
          GitLab MRs
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button onClick={handleAuthorize}>Authorize</Button>
        {/* {mrDdata.assigned.map((mr) => (
          <MRItem mr={mr} key={mr.id} />
        ))}
        {mrDdata.review.map((mr) => (
          <MRItem mr={mr} key={mr.id} />
        ))} */}
      </CardContent>
    </Card>
  );
}
