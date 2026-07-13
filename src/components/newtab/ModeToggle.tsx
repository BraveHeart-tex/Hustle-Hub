import { Moon, Sun } from 'lucide-react';

import { useTheme } from '@/components/newtab/ThemeProvider';
import { Button } from '@/components/ui/button';

export function ModeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      aria-label="Dark mode"
      aria-pressed={theme === 'dark'}
      title="Toggle dark mode"
    >
      <Sun className="h-[1.2rem] w-[1.2rem] motion-safe:scale-100 motion-safe:rotate-0 motion-safe:transition-all dark:motion-safe:scale-0 dark:motion-safe:-rotate-90 motion-reduce:opacity-100 dark:motion-reduce:opacity-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] motion-safe:scale-0 motion-safe:rotate-90 motion-safe:transition-all dark:motion-safe:scale-100 dark:motion-safe:rotate-0 motion-reduce:opacity-0 dark:motion-reduce:opacity-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
