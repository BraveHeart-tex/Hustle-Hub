import { AlertCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const CallbackErrorPage = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-bold text-balance">
            Authentication Failed
          </CardTitle>
          <CardDescription className="text-muted-foreground text-pretty">
            We encountered an issue while trying to authenticate your account.
            This could be due to an expired link or network issue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" asChild className="w-full bg-transparent">
            <a href="/" target="_blank" rel="noreferrer">
              Return to Home
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
export default CallbackErrorPage;
