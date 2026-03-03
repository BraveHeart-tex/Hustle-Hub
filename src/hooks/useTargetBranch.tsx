export const useTargetBranch = () => {
  const [targetBranch, setTargetBranch] = useState('');

  useEffect(() => {
    let debounceTimer: NodeJS.Timeout;
    const observer = new MutationObserver(() => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const target =
          document
            .querySelector<HTMLElement>('[data-testid="widget-target-branch"]')
            ?.textContent?.trim() ?? '';
        setTargetBranch(target);
      }, 300);
    });

    const targetNode = document.querySelector('#widget-state') || document.body;
    observer.observe(targetNode, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
      clearTimeout(debounceTimer);
    };
  }, []);

  return targetBranch;
};
