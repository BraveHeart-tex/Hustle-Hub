import { RefreshCwIcon } from 'lucide-react';

import { ModeToggle } from '@/components/ModeToggle';
import { Button } from '@/components/ui/button';

export default function Header() {
  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-4 py-3">
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
            <Button variant="ghost" size="icon">
              <RefreshCwIcon className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
