import {
  extractJiraId,
  getJiraTaskUrl,
  waitForElement,
  waitForLabel,
} from '@/lib/utils';
import { defineContentScript } from '#imports';

const clickIfExists = (selector: string) => {
  const element = document.querySelector<HTMLElement>(selector);
  if (element && typeof element.click === 'function') element.click();
};

const safeClick = async (selector: string, timeout = 5000) => {
  try {
    const element = await waitForElement<HTMLElement>(selector, timeout);
    element.click();
    return element;
  } catch (error) {
    console.error(`Element '${selector}' not found or clickable:`, error);
    return null;
  }
};

const getContentEditorMode = () => {
  try {
    const mode = localStorage.getItem('gl-markdown-editor-mode') as
      | 'contentEditor'
      | 'markdownField'
      | null;

    if (!mode) return null;

    return mode === 'contentEditor' ? 'markdown' : 'plainText';
  } catch (error) {
    console.error('getContentEditorMode error', error);
    return null;
  }
};

const handleDescriptionGeneration = async () => {
  let editorMode = getContentEditorMode();

  if (!editorMode) {
    const toggleButton = await waitForElement('#switch-to-rich-text-editor');

    if (!toggleButton) {
      console.log('Cannot find toggle button on description group');
      return;
    }

    const buttonText = toggleButton.textContent?.trim() ?? '';

    const shouldSwitchToPlainText =
      buttonText === 'Switch to plain text editing';

    editorMode = shouldSwitchToPlainText ? 'markdown' : 'plainText';
  }

  if (editorMode === 'plainText') {
    console.log('writing to textarea');
    const descriptionInput = await waitForElement<HTMLTextAreaElement>(
      '#merge_request_description',
    );
    if (descriptionInput) {
      descriptionInput.value = getJiraTaskUrl('FEREL-NUMBER-HERE');
    }
  } else if (editorMode === 'markdown') {
    console.log('writing to rich text editor');

    const editableDescription = await waitForElement(
      '[data-testid="content_editor_editablebox"] [contenteditable="true"]',
    );

    console.log(editableDescription);

    if (editableDescription) {
      console.log('writing to editable description');
      editableDescription.dispatchEvent(
        new FocusEvent('focus', { bubbles: true }),
      );
      const data = getJiraTaskUrl('FEREL-TASK_NUMBER_HERE');

      editableDescription.textContent = data;

      editableDescription.dispatchEvent(
        new InputEvent('input', {
          bubbles: true,
          inputType: 'insertText',
          data,
        }),
      );

      editableDescription.dispatchEvent(
        new FocusEvent('blur', { bubbles: true }),
      );
    }
  }
};

export default defineContentScript({
  matches: ['*://*.gitlab.com/*/merge_requests/*'],
  main: async () => {
    const params = new URLSearchParams(location.search);
    const isProductionMr =
      params.get('merge_request[target_branch]') === 'main';

    if (!isProductionMr) {
      return;
    }

    const sourceBranch = params.get('merge_request[source_branch]') || '';
    const titleInput = document.querySelector<HTMLInputElement>(
      '#merge_request_title',
    );

    if (!titleInput) {
      console.log('Merge request title input not found!');
      return;
    }

    const jiraId = extractJiraId(sourceBranch) ?? '';

    titleInput.value = `Production Release for ${jiraId}`;

    clickIfExists('[data-testid="assign-to-me-link"]');

    await safeClick('button[data-field-name="merge_request[reviewer_ids][]"]');

    const reviewerSelector = `li[data-user-id="${import.meta.env.VITE_RELEASE_REVIEWER_USER_ID}"] a`;
    const reviewer = await safeClick(reviewerSelector);
    if (reviewer) {
      console.log(
        `✅ Reviewer ${import.meta.env.VITE_RELEASE_REVIEWER_USER_ID} selected.`,
      );
      clickIfExists('[data-testid="close-icon"]');
    }

    const dropdownBtn = await safeClick(
      '[data-testid="issuable-label-dropdown"]',
    );
    if (!dropdownBtn) return;

    try {
      const labelButton = await waitForLabel('target::production', 5000);
      labelButton.click();
      console.log(`✅ Label target::production selected.`);

      clickIfExists('[data-testid="close-labels-dropdown-button"]');

      await handleDescriptionGeneration();
    } catch (err) {
      console.error('Label selection failed:', err);
    }
  },
  runAt: 'document_end',
});
