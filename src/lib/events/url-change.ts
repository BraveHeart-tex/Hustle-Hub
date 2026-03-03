const URL_CHANGE_EVENT = 'gitlab-url-change' as const;

interface UrlChangeEventDetail {
  href: string;
  pathname: string;
  search: string;
}

class UrlChangeEvent extends CustomEvent<UrlChangeEventDetail> {
  constructor() {
    super(URL_CHANGE_EVENT, {
      detail: {
        href: window.location.href,
        pathname: window.location.pathname,
        search: window.location.search,
      },
    });
  }
}

export const dispatchUrlChange = () =>
  window.dispatchEvent(new UrlChangeEvent());

export const listenUrlChange = (cb: (detail: UrlChangeEventDetail) => void) => {
  const handler = (e: Event) => cb((e as UrlChangeEvent).detail);
  window.addEventListener(URL_CHANGE_EVENT, handler);
  return () => window.removeEventListener(URL_CHANGE_EVENT, handler);
};
