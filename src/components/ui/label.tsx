import { Root as LabelPrimitiveRoot } from '@radix-ui/react-label';
import { type ComponentProps } from 'react';

import { cn } from '@/lib/utils';

function Label({
  className,
  ...props
}: ComponentProps<typeof LabelPrimitiveRoot>) {
  return (
    <LabelPrimitiveRoot
      data-slot="label"
      className={cn(
        'flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50 group-data-[disabled=true]:text-red-500',
        className,
      )}
      {...props}
    />
  );
}

export { Label };
