export const waitForLabel = (
  labelText: string,
  timeout = 5000,
): Promise<HTMLElement> => {
  return new Promise((resolve, reject) => {
    const observer = new MutationObserver(() => {
      const labels = document.querySelectorAll('[data-testid="labels-list"]');
      for (const label of labels) {
        let span = label.querySelector('span');
        if (span?.hasAttribute('data-testid')) {
          const sibling = span.nextElementSibling as HTMLElement;
          if (sibling && sibling.tagName === 'SPAN') {
            span = sibling;
          }
        }

        if (span && span.textContent.trim() === labelText) {
          observer.disconnect();
          resolve(label as HTMLElement);
          return;
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Timeout: Label "${labelText}" not found`));
    }, timeout);
  });
};
