import { type ComponentProps } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FilterButtonProps extends ComponentProps<typeof Button> {
  active: boolean;
}

const FilterButton = ({
  active,
  className,
  children,
  ...props
}: FilterButtonProps) => {
  return (
    <Button
      size={'sm'}
      variant={active ? 'default' : 'outline'}
      className={cn(
        active && 'border dark:border-input',
        'capitalize',
        className,
      )}
      {...props}
    >
      {children}
    </Button>
  );
};
export default FilterButton;
