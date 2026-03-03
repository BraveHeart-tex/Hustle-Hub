import { listenUrlChange } from '@/lib/events/url-change';

interface UrlState {
  href: string;
  pathname: string;
  search: string;
  params: URLSearchParams;
}

const getUrlState = (): UrlState => ({
  href: window.location.href,
  pathname: window.location.pathname,
  search: window.location.search,
  params: new URLSearchParams(window.location.search),
});

export function useUrlChange(): UrlState {
  const [state, setState] = useState<UrlState>(getUrlState);

  useEffect(() => {
    const unlisten = listenUrlChange((detail) => {
      setState({
        ...detail,
        params: new URLSearchParams(detail.search),
      });
    });
    return unlisten;
  }, []);

  return state;
}
