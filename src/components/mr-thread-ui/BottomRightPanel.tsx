import { PropsWithChildren } from 'react';

export const BottomRightPanel = ({ children }: PropsWithChildren) => {
  return <div className="fixed bottom-6 right-6 z-999999">{children}</div>;
};
