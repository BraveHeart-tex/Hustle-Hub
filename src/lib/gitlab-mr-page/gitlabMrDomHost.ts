import { listenUrlChange } from '@/lib/events/url-change';
import type { GitLabMrHost } from '@/lib/gitlab-mr-page/gitlabMrHost';

export function createGitLabMrDomHost(): GitLabMrHost {
  return {
    getDocument: () => document,
    getHref: () => window.location.href,
    observeMutations: (target, options, callback) => {
      const observer = new MutationObserver(callback);
      observer.observe(target, options);
      return observer;
    },
    onNavigation: (listener) => listenUrlChange(() => listener()),
    scrollIntoView: (element, options) => element.scrollIntoView(options),
  };
}
