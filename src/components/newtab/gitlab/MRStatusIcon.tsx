import { cva, VariantProps } from 'class-variance-authority';
import { JSX } from 'react';

import { cn } from '@/lib/utils';

interface MRStatusIconProps {
  title: string;
  icon: JSX.Element;
  className?: string;
  style?: React.CSSProperties;
}

const mrStatusIconVariants = cva(
  "absolute -top-2 -right-2 rounded-full p-1 shadow-md [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        warning:
          'bg-yellow-500 text-yellow-50 dark:bg-yellow-700 dark:text-yellow-100',
        destructive: 'bg-destructive text-destructive-foreground',
      },
    },
  },
);

const MRStatusIcon = ({
  title,
  icon,
  variant,
  className,
  style,
}: MRStatusIconProps & VariantProps<typeof mrStatusIconVariants>) => {
  return (
    <div
      title={title}
      className={cn(
        mrStatusIconVariants({
          variant,
          className,
        }),
      )}
      style={style}
    >
      {icon}
    </div>
  );
};

export default MRStatusIcon;
