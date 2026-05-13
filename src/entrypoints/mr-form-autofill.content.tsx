import { createRoot } from 'react-dom/client';
import type { ContentScriptContext } from 'wxt/utils/content-script-context';

import { ReviewerControlsApp } from '@/components/reviewer-presets/ReviewerControlsApp';
import { waitForElement } from '@/lib/utils/dom/waitForElement';
import { extractJiraId } from '@/lib/utils/misc/extractJiraId';
import { getJiraTaskUrl } from '@/lib/utils/misc/getJiraTaskUrl';
import { fetchFerelKey } from '@/services/jira';
import { defineContentScript } from '#imports';

const SELECTORS = {
  title: '#merge_request_title',
  sourceBranch: 'input#merge_request_source_branch',
  assignMe: '[data-testid="assign-to-me-link"]',
  reviewerDropdown: 'button[data-field-name="merge_request[reviewer_ids][]"]',
  labelDropdown: '[data-testid="issuable-label-dropdown"]',
  labelList: '[data-testid="labels-list"]',
  closeLabels: '[data-testid="close-labels-dropdown-button"]',
  richTextEditor:
    '[data-testid="content_editor_editablebox"] [contenteditable="true"]',
  plainTextEditor: '#merge_request_description',
  editorToggle: '#switch-to-rich-text-editor',
  reviewerDropdownCloseIcon: '[data-testid="close-icon"]',
  reviewerDropdownOption: (reviewerId: string) =>
    `li[data-user-id="${reviewerId}"] a`,
};

const OPTIONAL_ELEMENT_TIMEOUT = 2500;
const DROPDOWN_OPTION_TIMEOUT = 3500;
const DESCRIPTION_EDITOR_TIMEOUT = 3500;
const FEREL_FALLBACK_KEY = 'FEREL-TASK_NUMBER_HERE';
const SYNC_LABEL = 'sync';

interface GitLabMergeRequestSearchResult {
  iid: number;
  web_url: string;
  reference: string;
}

const waitForOptionalElement = async <T extends Element>(
  selector: string,
  timeout = OPTIONAL_ELEMENT_TIMEOUT,
): Promise<T | null> => {
  try {
    return await waitForElement<T>(selector, timeout);
  } catch (error) {
    console.warn(`selector not available: ${selector}`, error);
    return null;
  }
};

const clickWhenAvailable = async (
  selector: string,
  timeout = OPTIONAL_ELEMENT_TIMEOUT,
) => {
  const el = await waitForOptionalElement<HTMLElement>(selector, timeout);
  el?.click();
  return Boolean(el);
};

const delay = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

const setInputValue = (
  el: HTMLInputElement | HTMLTextAreaElement,
  val: string,
) => {
  el.value = val;
  el.dispatchEvent(new Event('input', { bubbles: true }));
};

const findAndClickLabel = async (text: string) => {
  const labelList = await waitForOptionalElement(SELECTORS.labelList);
  if (!labelList) return false;

  const target = Array.from(
    document.querySelectorAll(`${SELECTORS.labelList} span`),
  ).find((el) => el.textContent?.trim() === text);

  if (!target) return false;

  (target.closest('li') || (target as HTMLElement)).click();
  return true;
};

const applyLabel = async (label: string) => {
  const openedLabelDropdown = await clickWhenAvailable(SELECTORS.labelDropdown);
  if (!openedLabelDropdown) return false;

  const selectedLabel = await findAndClickLabel(label).catch((error) => {
    console.error(`failed to select label: ${label}`, error);
    return false;
  });

  await clickWhenAvailable(SELECTORS.closeLabels);

  if (!selectedLabel) {
    console.warn(`label was not found: ${label}`);
  }

  return true;
};

const isRichTextEditorEnabled = async () => {
  if (localStorage.getItem('gl-markdown-editor-mode') === 'contentEditor') {
    return true;
  }

  const editorToggle = await waitForOptionalElement<HTMLElement>(
    SELECTORS.editorToggle,
  );

  return editorToggle?.textContent?.includes('plain text') ?? false;
};

const updateDescription = async (content: string) => {
  const isRichText = await isRichTextEditorEnabled();

  if (isRichText) {
    const el = await waitForOptionalElement<HTMLElement>(
      SELECTORS.richTextEditor,
      DESCRIPTION_EDITOR_TIMEOUT,
    );

    if (el) {
      el.focus();

      document.execCommand('selectAll');
      document.execCommand('insertText', false, content);

      el.blur();
      return true;
    }
  }

  const el = await waitForOptionalElement<HTMLTextAreaElement>(
    SELECTORS.plainTextEditor,
    DESCRIPTION_EDITOR_TIMEOUT,
  );
  if (el) {
    setInputValue(el, content);
    return true;
  }

  return false;
};

const mountReviewerControlsIfNeeded = async (
  ctx: ContentScriptContext,
  isNewMR: boolean,
  isEditMode: boolean,
) => {
  if (!isNewMR && !isEditMode) return;

  try {
    const ui = await createShadowRootUi(ctx, {
      name: 'gitlab-reviewers-popover-ui',
      position: 'inline',
      anchor: 'body',
      append: 'last',
      onMount: (container) => {
        const app = document.createElement('div');
        container.append(app);
        const root = createRoot(app);
        root.render(<ReviewerControlsApp container={container} />);
        return root;
      },
      onRemove: (root) => {
        root?.unmount();
      },
    });
    ui.mount();
  } catch (error) {
    console.error('failed to mount reviewer controls', error);
  }
};

const handleBranchRedirection = async () => {
  const input = await waitForOptionalElement<HTMLInputElement>(
    SELECTORS.sourceBranch,
  );
  if (!input) return;

  const checkAndRedirect = () => {
    const url = new URL(location.href);
    const prevSource = url.searchParams.get('merge_request[source_branch]');
    const newSource = input.value;
    if (prevSource !== newSource) {
      url.searchParams.set('merge_request[source_branch]', newSource);
      url.searchParams.set(
        'merge_request[target_branch]',
        input.value.startsWith('release/') ? 'main' : 'develop',
      );
      window.location.href = url.toString();
    }
  };

  new MutationObserver(checkAndRedirect).observe(input, {
    attributes: true,
    attributeFilter: ['value'],
  });
};

const setupBranchRedirectionIfNeeded = async (isNewMR: boolean) => {
  if (!isNewMR) return;

  await handleBranchRedirection();
};

const assignCurrentUser = async () => {
  await clickWhenAvailable(SELECTORS.assignMe);
};

const fillReleaseBasics = (params: URLSearchParams) => {
  const jiraId =
    extractJiraId(params.get('merge_request[source_branch]') ?? '') ?? '';

  const ferelKeyPromise = jiraId
    ? fetchFerelKey(jiraId)
    : Promise.resolve(FEREL_FALLBACK_KEY);

  const titlePromise = (async () => {
    const titleInput = await waitForOptionalElement<HTMLInputElement>(
      SELECTORS.title,
    );

    if (titleInput) {
      setInputValue(titleInput, `Production Release for ${jiraId}`);
    }
  })();

  return { ferelKeyPromise, titlePromise };
};

const selectReleaseReviewer = async (reviewerId: string) => {
  if (!reviewerId) return;

  const openedDropdown = await clickWhenAvailable(SELECTORS.reviewerDropdown);
  if (!openedDropdown) return;

  const selectedReviewer = await clickWhenAvailable(
    SELECTORS.reviewerDropdownOption(reviewerId),
    DROPDOWN_OPTION_TIMEOUT,
  );

  if (selectedReviewer) {
    await delay(150);
    await clickWhenAvailable(SELECTORS.reviewerDropdownCloseIcon);
  }
};

const applyProductionLabelAndDescription = async (
  ferelKeyPromise: Promise<string>,
) => {
  await applyLabel('target::production');

  const ferelKey = await ferelKeyPromise;
  await updateDescription(getJiraTaskUrl(ferelKey));
};

const getSyncSourceKey = (sourceBranch: string | null): string | null => {
  if (!sourceBranch?.startsWith('sync/')) return null;

  const syncSourceKey = sourceBranch.slice('sync/'.length).trim();
  return syncSourceKey || null;
};

const getGitLabProjectPathFromUrl = (url: string): string | null => {
  const { pathname } = new URL(url);

  const marker = '/-/';
  const markerIndex = pathname.indexOf(marker);

  if (markerIndex === -1) return null;

  return decodeURIComponent(pathname.slice(1, markerIndex));
};

const fetchRelatedReleaseMergeRequest = async (
  syncSourceKey: string,
): Promise<GitLabMergeRequestSearchResult | null> => {
  const projectPath = getGitLabProjectPathFromUrl(window.location.href);

  if (!projectPath) {
    console.error('Failed to extract project path from url');
    return null;
  }

  const gitlabRequestParams = new URLSearchParams({
    state: 'opened',
    search: `Production Release for ${syncSourceKey}`,
    in: 'title',
    order_by: 'updated_at',
    sort: 'desc',
    per_page: '20',
    scope: 'assigned_to_me',
  });

  const response = await fetch(
    `https://gitlab.com/api/v4/projects/${encodeURIComponent(
      projectPath,
    )}/merge_requests?${gitlabRequestParams.toString()}`,
  );

  if (!response.ok) {
    console.warn('Gitlab request for release MR details failed');
    return null;
  }

  const mergeRequests =
    (await response.json()) as GitLabMergeRequestSearchResult[];

  if (!Array.isArray(mergeRequests) || mergeRequests.length === 0) {
    console.warn('MR data for sync merge request base was not found.');
    return null;
  }

  return mergeRequests[0];
};

const fillSyncMergeRequest = async (
  params: URLSearchParams,
  assignCurrentUserPromise: Promise<void>,
) => {
  const syncSourceKey = getSyncSourceKey(
    params.get('merge_request[source_branch]'),
  );

  if (!syncSourceKey) return false;

  const relatedReleaseMergeRequestPromise =
    fetchRelatedReleaseMergeRequest(syncSourceKey);
  const updateDescriptionPromise = relatedReleaseMergeRequestPromise.then(
    (relatedReleaseMergeRequest) => {
      if (!relatedReleaseMergeRequest) return false;

      return updateDescription(
        `${relatedReleaseMergeRequest.web_url} için sync MR`,
      );
    },
  );

  await Promise.allSettled([
    assignCurrentUserPromise,
    applyLabel(SYNC_LABEL),
    updateDescriptionPromise,
  ]);

  return true;
};

export default defineContentScript({
  matches: ['*://*.gitlab.com/*/merge_requests/*'],
  cssInjectionMode: 'ui',
  async main(ctx) {
    const params = new URLSearchParams(location.search);
    const isNewMR = location.pathname.endsWith('/-/merge_requests/new');
    const isEditMode = /\/.+\/-\/merge_requests\/\d+\/edit$/.test(
      location.pathname,
    );

    void mountReviewerControlsIfNeeded(ctx, isNewMR, isEditMode);
    void setupBranchRedirectionIfNeeded(isNewMR);
    const assignCurrentUserPromise = assignCurrentUser();

    const filledSyncMergeRequest = await fillSyncMergeRequest(
      params,
      assignCurrentUserPromise,
    );

    if (filledSyncMergeRequest) {
      return;
    }

    if (params.get('merge_request[target_branch]') !== 'main') {
      await assignCurrentUserPromise;
      return;
    }

    const { ferelKeyPromise, titlePromise } = fillReleaseBasics(params);
    const reviewerId = import.meta.env.VITE_RELEASE_REVIEWER_USER_ID;

    await Promise.allSettled([
      assignCurrentUserPromise,
      titlePromise,
      selectReleaseReviewer(reviewerId),
    ]);

    await applyProductionLabelAndDescription(ferelKeyPromise);
  },
  runAt: 'document_end',
});
