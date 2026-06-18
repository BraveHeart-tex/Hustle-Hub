import {
  Content as DropdownMenuPrimitiveContent,
  Group as DropdownMenuPrimitiveGroup,
  Item as DropdownMenuPrimitiveItem,
  Label as DropdownMenuPrimitiveLabel,
  Portal as DropdownMenuPrimitivePortal,
  Root as DropdownMenuPrimitiveRoot,
  Separator as DropdownMenuPrimitiveSeparator,
  Trigger as DropdownMenuPrimitiveTrigger,
} from '@radix-ui/react-dropdown-menu';
import { type ComponentProps } from 'react';

import { cn } from '@/lib/utils';

function DropdownMenu({
  ...props
}: ComponentProps<typeof DropdownMenuPrimitiveRoot>) {
  return <DropdownMenuPrimitiveRoot data-slot="dropdown-menu" {...props} />;
}

function DropdownMenuTrigger({
  ...props
}: ComponentProps<typeof DropdownMenuPrimitiveTrigger>) {
  return (
    <DropdownMenuPrimitiveTrigger
      data-slot="dropdown-menu-trigger"
      {...props}
    />
  );
}

function DropdownMenuContent({
  className,
  sideOffset = 4,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitiveContent>) {
  return (
    <DropdownMenuPrimitivePortal>
      <DropdownMenuPrimitiveContent
        data-slot="dropdown-menu-content"
        sideOffset={sideOffset}
        className={cn(
          'bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 max-h-(--radix-dropdown-menu-content-available-height) min-w-[8rem] origin-(--radix-dropdown-menu-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border p-1 shadow-md',
          className,
        )}
        {...props}
      />
    </DropdownMenuPrimitivePortal>
  );
}

function DropdownMenuGroup({
  ...props
}: ComponentProps<typeof DropdownMenuPrimitiveGroup>) {
  return (
    <DropdownMenuPrimitiveGroup data-slot="dropdown-menu-group" {...props} />
  );
}

function DropdownMenuItem({
  className,
  inset,
  variant = 'default',
  ...props
}: ComponentProps<typeof DropdownMenuPrimitiveItem> & {
  inset?: boolean;
  variant?: 'default' | 'destructive';
}) {
  return (
    <DropdownMenuPrimitiveItem
      data-slot="dropdown-menu-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(
        "focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:*:[svg]:!text-destructive [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  );
}

function DropdownMenuLabel({
  className,
  inset,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitiveLabel> & {
  inset?: boolean;
}) {
  return (
    <DropdownMenuPrimitiveLabel
      data-slot="dropdown-menu-label"
      data-inset={inset}
      className={cn(
        'px-2 py-1.5 text-sm font-medium data-[inset]:pl-8',
        className,
      )}
      {...props}
    />
  );
}

function DropdownMenuSeparator({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitiveSeparator>) {
  return (
    <DropdownMenuPrimitiveSeparator
      data-slot="dropdown-menu-separator"
      className={cn('-mx-1 my-1 h-px bg-border', className)}
      {...props}
    />
  );
}

export {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
};
