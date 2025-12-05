import { CheckIcon, ChevronDownIcon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { NOTE_PRIORITIES, NotePriority } from '@/lib/constants';
import { cn } from '@/lib/utils';

const notePriorityColors = {
  high: `
    bg-red-600/20
    text-red-700
    border-red-700/40
    dark:bg-red-600/25
    dark:text-red-300
    dark:border-red-500/40
  `,
  medium: `
    bg-yellow-400/25
    text-yellow-900
    border-yellow-700/40
    dark:bg-yellow-500/25
    dark:text-yellow-100
    dark:border-yellow-400/40
  `,
  low: `
    bg-emerald-400/25
    text-emerald-900
    border-emerald-700/40
    dark:bg-emerald-500/25
    dark:text-emerald-100
    dark:border-emerald-400/40
  `,
};

const iconColor = {
  high: 'text-red-700 dark:text-red-300',
  medium: 'text-yellow-900 dark:text-yellow-100',
  low: 'text-emerald-900 dark:text-emerald-100',
};

interface NotePriorityDropdownProps {
  value: string;
  onChange: (priority: NotePriority) => void;
}

export const NotePriorityDropdown = ({
  value,
  onChange,
}: NotePriorityDropdownProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Badge
          variant="outline"
          className={`text-xs ${notePriorityColors[value as keyof typeof notePriorityColors]} capitalize min-w-20 inline-flex items-center justify-between z-10 h-7!`}
        >
          {value}
          <ChevronDownIcon
            className={iconColor[value as keyof typeof iconColor]}
          />
        </Badge>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Priority</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {Object.keys(NOTE_PRIORITIES).map((priorityKey) => {
          const optionValue =
            NOTE_PRIORITIES[priorityKey as keyof typeof NOTE_PRIORITIES];
          return (
            <DropdownMenuItem
              key={optionValue}
              onClick={(event) => {
                event.stopPropagation();
                onChange(optionValue);
              }}
            >
              <Badge
                variant="outline"
                className={cn(
                  `text-xs capitalize w-full flex items-center z-10 h-7!`,
                  notePriorityColors[
                    optionValue as keyof typeof notePriorityColors
                  ],
                  value === optionValue ? 'justify-between' : 'justify-start',
                )}
              >
                {priorityKey.charAt(0).toUpperCase() +
                  priorityKey.toLowerCase().slice(1)}
                {value === optionValue ? (
                  <CheckIcon
                    className={cn('h-4 w-4', iconColor[optionValue])}
                  />
                ) : null}
              </Badge>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
