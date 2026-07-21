import { createRoot } from 'react-dom/client';
import type { ContentScriptContext } from 'wxt/utils/content-script-context';

import { AutofillProgressApp } from '@/components/autofill-progress/AutofillProgressApp';
import { ReviewerControlsApp } from '@/components/reviewer-presets/ReviewerControlsApp';
import { progressStore, runStep } from '@/lib/autofill-progress/progressStore';
import { waitForElement } from '@/lib/utils/dom/waitForElement';
import { extractJiraId } from '@/lib/utils/misc/extractJiraId';
import { getJiraTaskUrl } from '@/lib/utils/misc/getJiraTaskUrl';
import { fetchFerelKey, fetchJiraIssueDetails } from '@/services/jira';
import { defineContentScript } from '#imports';

const SELECTORS = {
  title: '#merge_request_title',
  sourceBranch: 'input#merge_request_source_branch',
  assignMe: '[data-testid="assign-to-me-link"]',
  reviewerDropdown: 'button[data-field-name="merge_request[reviewer_ids][]"]',
  labelDropdown: '[data-testid="issuable-label-dropdown"]',
  labelList: '[data-testid="labels-list"]',
  closeLabels: '[data-testid="close-labels-dropdown-button"]',
  plainTextEditor: '#merge_request_description',
  switchToPlainTextEditor: '#switch-to-plain-text-editor',
  reviewerDropdownCloseIcon: '[data-testid="close-icon"]',
  reviewerDropdownOption: (reviewerId: string) =>
    `li[data-user-id="${reviewerId}"] a`,
};

const OPTIONAL_ELEMENT_TIMEOUT = 2500;
const DROPDOWN_OPTION_TIMEOUT = 3500;
const DESCRIPTION_EDITOR_TIMEOUT = 3500;
const FEREL_FALLBACK_KEY = 'FEREL-TASK_NUMBER_HERE';
const JIRA_TASK_FALLBACK_KEY = 'JIRA-TASK_NUMBER_HERE';

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
  if (!el) return false;

  try {
    el.click();
  } catch (error) {
    console.warn(`failed to click: ${selector}`, error);
    return false;
  }

  return true;
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

const switchToMarkdownField = async () => {
  localStorage.setItem('gl-markdown-editor-mode', 'markdownField');

  await waitForOptionalElement(
    `${SELECTORS.plainTextEditor}, ${SELECTORS.switchToPlainTextEditor}`,
  );

  const switchButton = document.querySelector<HTMLElement>(
    SELECTORS.switchToPlainTextEditor,
  );
  switchButton?.click();
};

const updateDescription = async (content: string) => {
  await switchToMarkdownField();

  const el = await waitForOptionalElement<HTMLTextAreaElement>(
    SELECTORS.plainTextEditor,
    DESCRIPTION_EDITOR_TIMEOUT,
  );

  if (!el) return false;

  setInputValue(el, content);
  return true;
};

const mountReviewerControlsIfNeeded = async (
  ctx: ContentScriptContext,
  isNewMR: boolean,
  isEditMode: boolean,
) => {
  if (!isNewMR && !isEditMode) return;

  const creationFormReady = await waitForOptionalElement(SELECTORS.title);
  if (!creationFormReady) return;

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

const mountAutofillProgress = async (ctx: ContentScriptContext) => {
  try {
    const ui = await createShadowRootUi(ctx, {
      name: 'gitlab-autofill-progress-ui',
      position: 'inline',
      anchor: 'body',
      append: 'last',
      onMount: (container) => {
        const app = document.createElement('div');
        container.append(app);
        const root = createRoot(app);
        root.render(<AutofillProgressApp />);
        return root;
      },
      onRemove: (root) => {
        root?.unmount();
      },
    });
    ui.mount();
  } catch (error) {
    console.error('failed to mount autofill progress', error);
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
  return clickWhenAvailable(SELECTORS.assignMe);
};

const capitalizeFirstLetter = (value: string) => {
  if (!value) return value;

  return value.charAt(0).toUpperCase() + value.slice(1);
};

const getCommitMessageWithoutScope = (commitMessage: string) => {
  const trimmedCommitMessage = commitMessage.trim();
  const alreadyFormattedTitleMatch =
    trimmedCommitMessage.match(/^[A-Z]+-\d+:\s*(.+)$/);

  if (alreadyFormattedTitleMatch) return alreadyFormattedTitleMatch[1].trim();

  const conventionalCommitMatch = trimmedCommitMessage.match(
    /^[a-z]+(?:\([^)]+\))?!?:\s*(.+)$/i,
  );

  if (!conventionalCommitMatch) return trimmedCommitMessage;

  return conventionalCommitMatch[1].trim();
};

const getFeatureMergeRequestTitle = (
  jiraId: string,
  commitMessage: string,
): string | null => {
  if (!jiraId) return null;

  const commitMessageWithoutScope = getCommitMessageWithoutScope(commitMessage);
  if (!commitMessageWithoutScope) return null;

  return `${jiraId}: ${capitalizeFirstLetter(commitMessageWithoutScope)}`;
};

const getSourceBranchJiraId = (params: URLSearchParams) => {
  return extractJiraId(params.get('merge_request[source_branch]') ?? '');
};

const fillFeatureMergeRequestTitle = async (params: URLSearchParams) => {
  const titleInput = await waitForOptionalElement<HTMLInputElement>(
    SELECTORS.title,
  );

  if (!titleInput) return false;

  const jiraId =
    getSourceBranchJiraId(params) ?? extractJiraId(titleInput.value) ?? '';
  const title = getFeatureMergeRequestTitle(jiraId, titleInput.value);

  if (!title) return false;

  setInputValue(titleInput, title);
  return true;
};

const getMergeRequestJiraId = async (params: URLSearchParams) => {
  const sourceBranchJiraId = getSourceBranchJiraId(params);
  if (sourceBranchJiraId) return sourceBranchJiraId;

  const titleInput = await waitForOptionalElement<HTMLInputElement>(
    SELECTORS.title,
  );

  return extractJiraId(titleInput?.value ?? '');
};

const getResolvedJiraIssueKey = async (jiraId: string) => {
  try {
    const issueDetails = await fetchJiraIssueDetails(jiraId);
    return issueDetails.key;
  } catch (error) {
    console.warn(`Failed to fetch Jira issue details for ${jiraId}:`, error);
    return jiraId;
  }
};

const fillFeatureMergeRequestDescription = async (params: URLSearchParams) => {
  const jiraId = await getMergeRequestJiraId(params);

  if (!jiraId) return false;

  return updateDescription(`Jira: ${getJiraTaskUrl(jiraId)}`);
};

const fillReleaseBasics = (jiraId: string) => {
  const ferelKeyPromise = jiraId
    ? fetchFerelKey(jiraId)
    : Promise.resolve(FEREL_FALLBACK_KEY);

  const titlePromise = runStep('title', async () => {
    const titleInput = await waitForOptionalElement<HTMLInputElement>(
      SELECTORS.title,
    );

    if (!titleInput) return false;

    setInputValue(titleInput, `Production Release for ${jiraId}`);
    return true;
  });

  return { ferelKeyPromise, titlePromise };
};

const getReleaseJiraIssueKey = async (jiraId: string | null) => {
  if (!jiraId) return JIRA_TASK_FALLBACK_KEY;

  return getResolvedJiraIssueKey(jiraId);
};

const getReleaseDescription = (ferelKey: string, jiraIssueKey: string) => {
  return [
    `FEREL: ${getJiraTaskUrl(ferelKey)}`,
    '\n',
    `Jira Task: ${getJiraTaskUrl(jiraIssueKey)}`,
  ].join('\n');
};

const selectReleaseReviewer = async (reviewerId: string) => {
  if (!reviewerId) return false;

  const openedDropdown = await clickWhenAvailable(SELECTORS.reviewerDropdown);
  if (!openedDropdown) return false;

  const selectedReviewer = await clickWhenAvailable(
    SELECTORS.reviewerDropdownOption(reviewerId),
    DROPDOWN_OPTION_TIMEOUT,
  );

  if (selectedReviewer) {
    await delay(150);
    await clickWhenAvailable(SELECTORS.reviewerDropdownCloseIcon);
  }

  return selectedReviewer;
};

const applyProductionLabelAndDescription = async (
  ferelKeyPromise: Promise<string>,
  jiraIssueKeyPromise: Promise<string>,
) => {
  await runStep('label', () => applyLabel('target::production'));

  const [ferelKey, jiraIssueKey] = await Promise.all([
    ferelKeyPromise,
    jiraIssueKeyPromise,
  ]);
  await runStep('description', () =>
    updateDescription(getReleaseDescription(ferelKey, jiraIssueKey)),
  );
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

    if (!isNewMR) return;

    void setupBranchRedirectionIfNeeded(isNewMR);

    const creationFormReady = await waitForOptionalElement(SELECTORS.title);
    if (!creationFormReady) return;

    void mountAutofillProgress(ctx);

    const isRelease = params.get('merge_request[target_branch]') === 'main';

    if (!isRelease) {
      progressStore.registerSteps([
        { id: 'assign', label: 'Assign to me' },
        { id: 'title', label: 'Set title' },
        { id: 'description', label: 'Add Jira link' },
      ]);

      await Promise.allSettled([
        runStep('assign', assignCurrentUser),
        runStep('title', () => fillFeatureMergeRequestTitle(params)),
        runStep('description', () =>
          fillFeatureMergeRequestDescription(params),
        ),
      ]);
      return;
    }

    progressStore.registerSteps([
      { id: 'assign', label: 'Assign to me' },
      { id: 'title', label: 'Set title' },
      { id: 'reviewer', label: 'Select reviewer' },
      { id: 'label', label: 'Apply production label' },
      { id: 'description', label: 'Add FEREL + Jira links' },
    ]);

    const releaseJiraId = await getMergeRequestJiraId(params);
    const releaseJiraIssueKeyPromise = getReleaseJiraIssueKey(releaseJiraId);
    const { ferelKeyPromise, titlePromise } = fillReleaseBasics(
      releaseJiraId ?? '',
    );
    const reviewerId = import.meta.env.VITE_RELEASE_REVIEWER_USER_ID;

    await Promise.allSettled([
      runStep('assign', assignCurrentUser),
      titlePromise,
      runStep('reviewer', () => selectReleaseReviewer(reviewerId)),
    ]);

    await applyProductionLabelAndDescription(
      ferelKeyPromise,
      releaseJiraIssueKeyPromise,
    );
  },
  runAt: 'document_end',
});
