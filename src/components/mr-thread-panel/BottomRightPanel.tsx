import { ReactNode } from 'react';

import { cn } from '@/lib/utils';

export const BottomRightPanel = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn('fixed bottom-6 right-6 z-999999', className)}>
      {children}
    </div>
  );
};
