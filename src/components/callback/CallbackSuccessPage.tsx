import { CheckCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { sendMessage } from '@/messaging';

const CallbackSuccessPage = () => {
  const goHome = () => {
    window.close();
    sendMessage('goHome');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-balance">
            Authentication Successful!
          </CardTitle>
          <CardDescription className="text-muted-foreground text-pretty">
            Welcome! Your account has been successfully authenticated. You can
            now access all features of your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button className="w-full" onClick={goHome}>
            Continue to Home
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
export default CallbackSuccessPage;
