import { Moon, Sun } from 'lucide-react';

import { useTheme } from '@/components/newtab/ThemeProvider';
import { Button } from '@/components/ui/button';

export function ModeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const nextTheme = resolvedTheme === 'light' ? 'dark' : 'light';
  const accessibleLabel = `Switch to ${nextTheme} theme`;

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(nextTheme)}
      aria-label={accessibleLabel}
      aria-pressed={resolvedTheme === 'dark'}
      title={accessibleLabel}
    >
      <Sun className="h-[1.2rem] w-[1.2rem] motion-safe:scale-100 motion-safe:rotate-0 motion-safe:transition-all dark:motion-safe:scale-0 dark:motion-safe:-rotate-90 motion-reduce:opacity-100 dark:motion-reduce:opacity-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] motion-safe:scale-0 motion-safe:rotate-90 motion-safe:transition-all dark:motion-safe:scale-100 dark:motion-safe:rotate-0 motion-reduce:opacity-0 dark:motion-reduce:opacity-100" />
    </Button>
  );
}
