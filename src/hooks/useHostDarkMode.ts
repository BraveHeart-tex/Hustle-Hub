import { useEffect, useState } from 'react';

// GitLab marks its dark theme with a `gl-dark` class on the <html> element and
// toggles it live when the user switches themes. Mirroring that class lets the
// injected Shadow-DOM UI resolve the same semantic tokens as the host page,
// instead of always rendering the light theme on top of a dark GitLab.
const isHostDark = (): boolean =>
  document.documentElement.classList.contains('gl-dark');

export const useHostDarkMode = (): boolean => {
  const [dark, setDark] = useState(isHostDark);

  useEffect(() => {
    const update = () => setDark(isHostDark());
    update();

    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  return dark;
};
