import { parseHTML } from 'linkedom';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  CodeReviewCommandsShortcut,
  getSelectedTemplate,
} from '@/components/mr-thread-panel/CodeReviewCommandsShortcut';
import { createGitLabMrPage } from '@/lib/gitlab-mr-page/gitlabMrPage';
import { GitLabMrPageProvider } from '@/lib/gitlab-mr-page/gitlabMrPageReact';
import { createGitLabMrFixtureHost } from '@/lib/gitlab-mr-page/testing/createGitLabMrFixtureHost';
import overviewHtml from '@/lib/gitlab-mr-page/testing/fixtures/mr-overview.html?raw';
import secondMrHtml from '@/lib/gitlab-mr-page/testing/fixtures/second-mr-overview.html?raw';

const mocks = vi.hoisted(() => {
  const defaultTemplate = {
    id: 'default',
    isDefault: true,
    name: 'Default',
    template: 'default-template',
    urlPattern: '',
  };

  return {
    defaultTemplate,
    renderTemplate: vi.fn(
      (template: string, variables: Record<string, string>) =>
        `${template}|${variables.source}|${variables.target}|${variables.url}`,
    ),
    sendMessage: vi.fn(),
    templates: [defaultTemplate],
  };
});

vi.mock('@/lib/messaging', () => ({ sendMessage: mocks.sendMessage }));
vi.mock('@/lib/storage/prompt-templates', () => ({
  pickTemplateForUrl: (templates: typeof mocks.templates) => templates[0],
  renderTemplate: mocks.renderTemplate,
  useStrictReviewTemplates: () => ({
    isLoading: false,
    loadError: null,
    reload: vi.fn(),
    templates: mocks.templates,
  }),
}));

const firstMrHref = 'https://gitlab.com/group/project/-/merge_requests/42';
const secondMrHref = 'https://gitlab.com/group/project/-/merge_requests/43';
let mountedRoot: ReturnType<typeof createRoot> | null = null;
let restoreMountedDom: (() => void) | null = null;

describe('CodeReviewCommandsShortcut', () => {
  afterEach(() => {
    act(() => {
      mountedRoot?.unmount();
    });
    mountedRoot = null;
    restoreMountedDom?.();
    restoreMountedDom = null;
    mocks.renderTemplate.mockClear();
    mocks.sendMessage.mockReset();
    mocks.templates = [mocks.defaultTemplate];
  });

  it.each([
    ['source', '<span data-testid="widget-target-branch">main</span>'],
    [
      'target',
      '<button class="js-source-branch-copy" data-clipboard-text="feature/test"></button>',
    ],
  ])(
    'is hidden while loading and when the %s branch is unavailable',
    async (_missingBranch, branchMarkup) => {
      const host = createGitLabMrFixtureHost({
        href: firstMrHref,
        html: overviewHtml,
      });
      const page = createGitLabMrPage(host);
      const container = render(page);

      expect(
        container.querySelector('[title="Copy review prompt"]'),
      ).toBeNull();

      host.replaceDocument(`<html><body>${branchMarkup}</body></html>`);
      await act(async () => {
        await flushReconciliation();
      });

      expect(
        container.querySelector('[title="Copy review prompt"]'),
      ).toBeNull();
    },
  );

  it('renders snapshot branch facts and URL in the copied prompt', async () => {
    const host = createGitLabMrFixtureHost({
      href: firstMrHref,
      html: overviewHtml,
    });
    const page = createGitLabMrPage(host);
    const container = render(page);
    await reconcile();

    await act(async () => {
      click(container, '[title="Copy review prompt"]');
    });

    expect(mocks.renderTemplate).toHaveBeenLastCalledWith('default-template', {
      source: 'feature/test',
      target: 'main',
      url: firstMrHref,
    });
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      `default-template|feature/test|main|${firstMrHref}`,
    );
  });

  it('keeps Claude payload construction and retry behavior in the caller', async () => {
    const host = createGitLabMrFixtureHost({
      href: firstMrHref,
      html: overviewHtml,
    });
    const page = createGitLabMrPage(host);
    const container = render(page);
    mocks.sendMessage
      .mockRejectedValueOnce(new Error('Receiving end does not exist'))
      .mockResolvedValueOnce({ ok: true });

    await reconcile();
    await act(async () => {
      click(container, '[title="Launch Claude"]');
    });

    expect(mocks.sendMessage).toHaveBeenCalledTimes(2);
    expect(mocks.sendMessage).toHaveBeenLastCalledWith('launchClaude', {
      jiraId: 'ABC-1',
      permissionMode: 'plan',
      prompt: `default-template|feature/test|main|${firstMrHref}`,
      slug: 'group/project',
    });
  });

  it('preserves a locally selected Strict Review template over the auto choice', () => {
    const specialTemplate = {
      id: 'special',
      isDefault: false,
      name: 'Special',
      template: 'special-template',
      urlPattern: '',
    };

    expect(
      getSelectedTemplate(
        [mocks.defaultTemplate, specialTemplate],
        specialTemplate.id,
        firstMrHref,
      ),
    ).toBe(specialTemplate);
  });

  it('shows native-host and messaging failures as Claude feedback', async () => {
    const page = createGitLabMrPage(
      createGitLabMrFixtureHost({ href: firstMrHref, html: overviewHtml }),
    );
    const container = render(page);
    mocks.sendMessage.mockResolvedValueOnce({
      error: 'Native launcher unavailable',
      ok: false,
    });

    await reconcile();
    await act(async () => {
      click(container, '[title="Launch Claude"]');
    });
    expect(container.querySelector('[role="status"]')?.textContent).toContain(
      'Launch failed: Native launcher unavailable',
    );
    expect(
      container.querySelector('[title="Native launcher unavailable"]'),
    ).not.toBeNull();

    mocks.sendMessage
      .mockReset()
      .mockRejectedValueOnce(new Error('Network down'));
    await act(async () => {
      click(container, '[title="Native launcher unavailable"]');
    });
    expect(container.querySelector('[role="status"]')?.textContent).toContain(
      'Launch failed: Network down',
    );
  });

  it('updates after reconciliation and never combines old branches with a new MR URL', async () => {
    const host = createGitLabMrFixtureHost({
      href: firstMrHref,
      html: overviewHtml,
    });
    const page = createGitLabMrPage(host);
    const container = render(page);
    await reconcile();

    act(() => {
      host.replaceDocument(secondMrHtml);
      host.emitMutation();
    });
    expect(
      container.querySelector('[title="Copy review prompt"]'),
    ).not.toBeNull();

    await act(async () => {
      click(container, '[title="Copy review prompt"]');
    });
    expect(mocks.renderTemplate).toHaveBeenLastCalledWith('default-template', {
      source: 'feature/test',
      target: 'main',
      url: firstMrHref,
    });

    await reconcile();
    expect(page.getSnapshot()).toMatchObject({
      sourceBranch: 'feature/second',
      status: 'ready',
      targetBranch: 'develop',
    });
    await act(async () => {
      click(container, '[title="Copy review prompt"]');
    });
    expect(mocks.renderTemplate).toHaveBeenLastCalledWith('default-template', {
      source: 'feature/second',
      target: 'develop',
      url: firstMrHref,
    });

    act(() => {
      host.setHref(secondMrHref);
      host.emitNavigation();
    });
    expect(container.querySelector('[title="Copy review prompt"]')).toBeNull();

    act(() => {
      host.emitMutation();
    });
    await reconcile();
    expect(page.getSnapshot()).toMatchObject({
      identity: { href: secondMrHref },
      sourceBranch: 'feature/second',
      status: 'ready',
      targetBranch: 'develop',
    });
    await act(async () => {
      click(container, '[title="Copy review prompt"]');
    });
    expect(mocks.renderTemplate).toHaveBeenLastCalledWith('default-template', {
      source: 'feature/second',
      target: 'develop',
      url: secondMrHref,
    });
  });
});

function render(page: ReturnType<typeof createGitLabMrPage>): HTMLElement {
  const dom = installDom();
  restoreMountedDom = dom.restore;
  (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
  act(() => {
    mountedRoot = createRoot(dom.container);
    mountedRoot.render(
      <GitLabMrPageProvider value={page}>
        <CodeReviewCommandsShortcut container={dom.container} jiraId="ABC-1" />
      </GitLabMrPageProvider>,
    );
  });
  return dom.container;
}

async function reconcile(): Promise<void> {
  await act(async () => {
    await flushReconciliation();
  });
}

function click(container: HTMLElement, selector: string): void {
  const element = container.querySelector<HTMLButtonElement>(selector);
  if (!element) throw new Error(`Missing ${selector}`);
  element.click();
}

function installDom(): { container: HTMLElement; restore: () => void } {
  const { document, window } = parseHTML('<html><body></body></html>');
  const globals = globalThis as Record<string, unknown>;
  const previous = {
    document: globals.document,
    navigator: globals.navigator,
    window: globals.window,
  };
  const writeText = vi.fn();

  globals.document = document;
  globals.navigator = {
    clipboard: { writeText },
  };
  globals.window = window;

  return {
    container: document.body,
    restore: () => Object.assign(globals, previous),
  };
}

async function flushReconciliation(): Promise<void> {
  await new Promise<void>((resolve) => queueMicrotask(resolve));
}
