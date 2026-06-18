import { useEffect, useState } from 'react';

export type Route = '/' | '/notes';

function readRoute(): Route {
  // HashRouter-style hashes look like "#/" or "#/notes"
  const hash = window.location.hash.replace(/^#/, '');
  return hash === '/notes' ? '/notes' : '/';
}

export function useHashRoute() {
  const [route, setRoute] = useState<Route>(readRoute);

  useEffect(() => {
    const onHashChange = () => setRoute(readRoute());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = (next: Route) => {
    window.location.hash = next;
  };

  return { route, navigate };
}
