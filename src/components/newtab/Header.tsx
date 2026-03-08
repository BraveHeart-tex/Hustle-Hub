import { useIsFetching, useQueryClient } from '@tanstack/react-query';
import { RefreshCwIcon, ZapIcon } from 'lucide-react';

import { ModeToggle } from '@/components/newtab/ModeToggle';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { AppSettings } from './AppSettings';
import AllCommentsWidget from './misc/AllCommentsWidget';

export default function Header() {
  const queryClient = useQueryClient();
  const isFetching = useIsFetching();

  const handleRefreshData = () => {
    void queryClient.refetchQueries({ type: 'active' });
  };

  return (
    <header className="border-b border-border bg-card">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <ZapIcon
                className="h-4 w-4 text-primary-foreground"
                fill="currentColor"
              />
            </div>
            <h1 className="text-xl font-bold text-foreground">Hustle Hub</h1>
          </div>
          <div className="flex items-center space-x-3">
            <AllCommentsWidget />
            <ModeToggle />
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefreshData}
              disabled={isFetching > 0}
            >
              <RefreshCwIcon
                className={cn('h-5 w-5', isFetching > 0 && 'animate-spin')}
              />
            </Button>
            <AppSettings />
          </div>
        </div>
      </div>
    </header>
  );
}
