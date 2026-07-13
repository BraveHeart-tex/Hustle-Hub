import {
  Anchor as PopoverPrimitiveAnchor,
  Content as PopoverPrimitiveContent,
  Portal as PopoverPrimitivePortal,
  Root as PopoverPrimitiveRoot,
  Trigger as PopoverPrimitiveTrigger,
} from '@radix-ui/react-popover';
import { type ComponentProps } from 'react';

import { cn } from '@/lib/utils';

function Popover({ ...props }: ComponentProps<typeof PopoverPrimitiveRoot>) {
  return <PopoverPrimitiveRoot data-slot="popover" {...props} />;
}

function PopoverTrigger({
  ...props
}: ComponentProps<typeof PopoverPrimitiveTrigger>) {
  return <PopoverPrimitiveTrigger data-slot="popover-trigger" {...props} />;
}

function PopoverContent({
  className,
  align = 'center',
  sideOffset = 4,
  container,
  ...props
}: ComponentProps<typeof PopoverPrimitiveContent> & {
  container?: HTMLElement | null;
}) {
  return (
    <PopoverPrimitivePortal container={container ?? document.body}>
      <PopoverPrimitiveContent
        data-slot="popover-content"
        align={align}
        sideOffset={sideOffset}
        className={cn(
          'bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 motion-reduce:animate-none motion-reduce:transition-none z-50 w-72 origin-(--radix-popover-content-transform-origin) rounded-md border p-4 shadow-floating outline-hidden',
          className,
        )}
        {...props}
      />
    </PopoverPrimitivePortal>
  );
}

function PopoverAnchor({
  ...props
}: ComponentProps<typeof PopoverPrimitiveAnchor>) {
  return <PopoverPrimitiveAnchor data-slot="popover-anchor" {...props} />;
}

export { Popover, PopoverAnchor, PopoverContent, PopoverTrigger };
