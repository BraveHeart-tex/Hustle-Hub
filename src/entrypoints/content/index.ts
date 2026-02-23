import { waitForElement } from '@/lib/utils/dom/waitForElement';
import { extractJiraId } from '@/lib/utils/misc/extractJiraId';
import { getJiraTaskUrl } from '@/lib/utils/misc/getJiraTaskUrl';
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
};

const click = async (sel: string) => {
  const el = await waitForElement<HTMLElement>(sel).catch(() => null);
  el?.click();
  return el;
};

const setInputValue = (
  el: HTMLInputElement | HTMLTextAreaElement,
  val: string,
) => {
  el.value = val;
  el.dispatchEvent(new Event('input', { bubbles: true }));
};

const findAndClickLabel = async (text: string) => {
  await waitForElement(SELECTORS.labelList);
  const target = Array.from(
    document.querySelectorAll(`${SELECTORS.labelList} span`),
  ).find((el) => el.textContent?.trim() === text);

  if (target) (target.closest('li') || (target as HTMLElement)).click();
};

const updateDescription = async (content: string) => {
  const isRichText =
    localStorage.getItem('gl-markdown-editor-mode') === 'contentEditor' ||
    (await waitForElement(SELECTORS.editorToggle)).textContent?.includes(
      'plain text',
    );

  if (isRichText) {
    const el = await waitForElement<HTMLElement>(SELECTORS.richTextEditor);
    el.focus();
    el.textContent = content;
    el.dispatchEvent(
      new InputEvent('input', {
        bubbles: true,
        inputType: 'insertText',
        data: content,
      }),
    );
    el.blur();
  } else {
    const el = await waitForElement<HTMLTextAreaElement>(
      SELECTORS.plainTextEditor,
    );
    setInputValue(el, content);
  }
};

const handleBranchRedirection = async () => {
  const input = await waitForElement<HTMLInputElement>(SELECTORS.sourceBranch);

  const checkAndRedirect = () => {
    const url = new URL(location.href);
    const prevSource = url.searchParams.get('merge_request[source_branch]');
    const newSource = input.value;
    if (input.value.startsWith('release/') && prevSource !== newSource) {
      url.searchParams.set('merge_request[source_branch]', newSource);
      url.searchParams.set('merge_request[target_branch]', 'main');
      window.location.href = url.toString();
    }
  };

  new MutationObserver(checkAndRedirect).observe(input, {
    attributes: true,
    attributeFilter: ['value'],
  });
};

export default defineContentScript({
  matches: ['*://*.gitlab.com/*/merge_requests/*'],
  main: async () => {
    const params = new URLSearchParams(location.search);
    const isNewMR = location.pathname.endsWith('/-/merge_requests/new');

    if (isNewMR) await handleBranchRedirection();
    if (params.get('merge_request[target_branch]') !== 'main') return;

    const jiraId =
      extractJiraId(params.get('merge_request[source_branch]') ?? '') ?? '';
    const titleInput = document.querySelector<HTMLInputElement>(
      SELECTORS.title,
    );
    if (titleInput)
      setInputValue(titleInput, `Production Release for ${jiraId}`);

    await click(SELECTORS.assignMe);
    await click(SELECTORS.reviewerDropdown);
    const reviewerId = import.meta.env.VITE_RELEASE_REVIEWER_USER_ID;
    if (await click(`li[data-user-id="${reviewerId}"] a`)) {
      await click('[data-testid="close-icon"]');
    }

    if (await click(SELECTORS.labelDropdown)) {
      await findAndClickLabel('target::production').catch(console.error);
      await click(SELECTORS.closeLabels);
      await updateDescription(getJiraTaskUrl('FEREL-TASK_NUMBER_HERE'));
    }
  },
  runAt: 'document_end',
});
