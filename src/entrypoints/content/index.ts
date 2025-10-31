import { waitForElement } from '@/lib/utils/dom/waitForElement';
import { extractJiraId } from '@/lib/utils/misc/extractJiraId';
import { getJiraTaskUrl } from '@/lib/utils/misc/getJiraTaskUrl';
import { defineContentScript } from '#imports';

const waitForLabel = (
  labelText: string,
  timeout = 5000,
): Promise<HTMLElement> => {
  return new Promise((resolve, reject) => {
    const observer = new MutationObserver(() => {
      const labels = document.querySelectorAll('[data-testid="labels-list"]');
      for (const label of labels) {
        let span = label.querySelector('span');
        if (span?.hasAttribute('data-testid')) {
          const sibling = span.nextElementSibling as HTMLElement;
          if (sibling && sibling.tagName === 'SPAN') {
            span = sibling;
          }
        }

        if (span && span.textContent.trim() === labelText) {
          observer.disconnect();
          resolve(label as HTMLElement);
          return;
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Timeout: Label "${labelText}" not found`));
    }, timeout);
  });
};

const clickElement = async (
  selector: string,
  { timeout = 5000, logError = true } = {},
): Promise<HTMLElement | null> => {
  try {
    const el = await waitForElement<HTMLElement>(selector, timeout);
    el.click();
    return el;
  } catch (err) {
    if (logError)
      console.error(`Element '${selector}' not found or clickable:`, err);
    return null;
  }
};

const getContentEditorMode = (): 'markdown' | 'plainText' | null => {
  try {
    const mode = localStorage.getItem('gl-markdown-editor-mode');
    if (!mode) return null;
    return mode === 'contentEditor' ? 'markdown' : 'plainText';
  } catch (err) {
    console.error('Error reading content editor mode:', err);
    return null;
  }
};

const writeToPlainText = async (value: string) => {
  const textarea = await waitForElement<HTMLTextAreaElement>(
    '#merge_request_description',
  );
  if (textarea) textarea.value = value;
};

const writeToRichText = async (value: string) => {
  const editable = await waitForElement<HTMLElement>(
    '[data-testid="content_editor_editablebox"] [contenteditable="true"]',
  );
  if (!editable) return;

  editable.dispatchEvent(new FocusEvent('focus', { bubbles: true }));
  editable.textContent = value;
  editable.dispatchEvent(
    new InputEvent('input', {
      bubbles: true,
      inputType: 'insertText',
      data: value,
    }),
  );
  editable.dispatchEvent(new FocusEvent('blur', { bubbles: true }));
};

const handleDescriptionGeneration = async () => {
  let editorMode = getContentEditorMode();

  if (!editorMode) {
    const toggleButton = await waitForElement('#switch-to-rich-text-editor');
    if (!toggleButton)
      return console.log('Cannot find toggle button on description group');

    editorMode =
      toggleButton.textContent?.trim() === 'Switch to plain text editing'
        ? 'markdown'
        : 'plainText';
  }

  const data = getJiraTaskUrl('FEREL-TASK_NUMBER_HERE');

  if (editorMode === 'plainText') await writeToPlainText(data);
  else if (editorMode === 'markdown') await writeToRichText(data);
};

export default defineContentScript({
  matches: ['*://*.gitlab.com/*/merge_requests/*'],
  main: async () => {
    const params = new URLSearchParams(location.search);
    if (params.get('merge_request[target_branch]') !== 'main') return;

    const sourceBranch = params.get('merge_request[source_branch]') ?? '';
    const titleInput = document.querySelector<HTMLInputElement>(
      '#merge_request_title',
    );
    if (!titleInput) return console.log('Merge request title input not found!');

    const jiraId = extractJiraId(sourceBranch) ?? '';
    titleInput.value = `Production Release for ${jiraId}`;

    await clickElement('[data-testid="assign-to-me-link"]', {
      logError: false,
    });
    await clickElement(
      'button[data-field-name="merge_request[reviewer_ids][]"]',
      { logError: false },
    );

    const reviewerSelector = `li[data-user-id="${import.meta.env.VITE_RELEASE_REVIEWER_USER_ID}"] a`;
    const reviewer = await clickElement(reviewerSelector);
    if (reviewer) {
      console.log(
        `✅ Reviewer ${import.meta.env.VITE_RELEASE_REVIEWER_USER_ID} selected.`,
      );
      clickElement('[data-testid="close-icon"]', { logError: false });
    }

    const dropdownBtn = await clickElement(
      '[data-testid="issuable-label-dropdown"]',
    );
    if (!dropdownBtn) return;

    try {
      const labelButton = await waitForLabel('target::production', 5000);
      labelButton.click();
      console.log('✅ Label target::production selected.');
      clickElement('[data-testid="close-labels-dropdown-button"]', {
        logError: false,
      });
      await handleDescriptionGeneration();
    } catch (err) {
      console.error('Label selection failed:', err);
    }
  },
  runAt: 'document_end',
});
