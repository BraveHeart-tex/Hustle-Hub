import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import {
  cloneElement,
  type ComponentProps,
  isValidElement,
  type ReactNode,
} from 'react';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  "relative cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all motion-reduce:transition-none active:shadow-interactive disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline:
          'border bg-background hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost:
          'hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2 has-[svg:not([data-slot=button-spinner])]:px-3',
        sm: 'h-8 rounded-md gap-1.5 px-3 has-[svg:not([data-slot=button-spinner])]:px-2.5',
        lg: 'h-10 rounded-md px-6 has-[svg:not([data-slot=button-spinner])]:px-4',
        icon: 'size-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

function ButtonLoadingContent({ children }: { children: ReactNode }) {
  return (
    <>
      <span className="inline-flex items-center justify-center gap-2 opacity-0">
        {children}
      </span>
      <Loader2
        aria-hidden="true"
        data-slot="button-spinner"
        className="absolute size-4 animate-spin motion-reduce:animate-none"
      />
    </>
  );
}

function Button({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  disabled,
  children,
  onClick,
  tabIndex,
  'aria-busy': ariaBusy,
  'aria-disabled': ariaDisabled,
  ...props
}: ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    loading?: boolean;
  }) {
  const Comp = asChild ? Slot : 'button';
  const interactionDisabled = disabled || loading;
  let content = children;

  if (loading) {
    if (asChild && isValidElement<{ children?: ReactNode }>(children)) {
      content = cloneElement(
        children,
        undefined,
        <ButtonLoadingContent>{children.props.children}</ButtonLoadingContent>,
      );
    } else {
      content = <ButtonLoadingContent>{children}</ButtonLoadingContent>;
    }
  }

  return (
    <Comp
      data-slot="button"
      data-loading={loading ? '' : undefined}
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={asChild ? undefined : interactionDisabled}
      aria-busy={loading ? true : ariaBusy}
      aria-disabled={asChild && interactionDisabled ? true : ariaDisabled}
      tabIndex={asChild && interactionDisabled ? -1 : tabIndex}
      onClick={(event) => {
        if (interactionDisabled) {
          event.preventDefault();
          return;
        }

        onClick?.(event);
      }}
      {...props}
    >
      {content}
    </Comp>
  );
}

export { Button, buttonVariants };
