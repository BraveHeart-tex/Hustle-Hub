import { useQueryClient } from '@tanstack/react-query';
import { RefreshCwIcon } from 'lucide-react';
import { useState } from 'react';

import { ModeToggle } from '@/components/newtab/ModeToggle';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function Header() {
  const [isPending, setIsPending] = useState(false);
  const queryClient = useQueryClient();

  const handleRefreshData = async () => {
    setIsPending(true);
    try {
      await queryClient.invalidateQueries();
    } finally {
      setIsPending(false);
    }
  };

  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-4 py-3 min-w-full">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">
                H
              </span>
            </div>
            <h1 className="text-xl font-bold text-foreground">Hustle Hub</h1>
          </div>

          <div className="flex items-center space-x-3">
            <ModeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefreshData}
              disabled={isPending}
            >
              <RefreshCwIcon
                className={cn('h-5 w-5', isPending && 'animate-spin')}
              />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
