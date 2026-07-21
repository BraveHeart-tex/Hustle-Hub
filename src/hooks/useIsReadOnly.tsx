import { useEffect, useState } from 'react';

import { computeReadOnly } from '@/lib/utils/misc/computeReadOnly';

export const useIsReadOnly = (userId: string) => {
  const [readOnly, setReadOnly] = useState<boolean>(false);

  useEffect(() => {
    const readReadOnly = () => {
      const assigneeIds = Array.from(
        document.querySelectorAll<HTMLAnchorElement>(
          '[data-testid="assignees-widget"] a[data-user-id]',
        ),
      )
        .map((anchor) => anchor.dataset.userId)
        .filter((id): id is string => !!id);

      setReadOnly(computeReadOnly(userId, assigneeIds));
    };

    readReadOnly();

    let debounceTimer: NodeJS.Timeout;
    const observer = new MutationObserver(() => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        readReadOnly();
      }, 300);
    });
    const targetNode =
      document.querySelector('[data-testid="assignees-widget"]') ||
      document.body;
    observer.observe(targetNode, {
      childList: true,
      subtree: true,
    });
    return () => {
      observer.disconnect();
      clearTimeout(debounceTimer);
    };
  }, [userId]);

  return readOnly;
};
