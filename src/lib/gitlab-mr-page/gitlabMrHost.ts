export type GitLabMrNavigationListener = () => void;

export interface GitLabMrMutationObserver {
  disconnect(): void;
}

export interface GitLabMrHost {
  getDocument(): Document;
  getHref(): string;
  observeMutations(
    target: Node,
    options: MutationObserverInit,
    callback: MutationCallback,
  ): GitLabMrMutationObserver;
  onNavigation(listener: GitLabMrNavigationListener): () => void;
  scrollIntoView(element: Element, options?: ScrollIntoViewOptions): void;
}
