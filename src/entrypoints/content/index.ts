import { defineContentScript } from '#imports';
import { extractJiraId, waitForElement, waitForLabel } from '@/lib/utils';

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

export default defineContentScript({
  matches: ['*://*.gitlab.com/*/merge_requests/*'],
  main: async () => {
    const params = new URLSearchParams(location.search);
    if (params.get('merge_request[target_branch]') !== 'main') return;

    const sourceBranch = params.get('merge_request[source_branch]') || '';
    const titleInput = document.querySelector<HTMLInputElement>(
      '#merge_request_title',
    );
    if (!titleInput) {
      console.log('Merge request title input not found!');
      return;
    }
    titleInput.value = `Production Release for ${extractJiraId(sourceBranch)}`;

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
      console.log('refactor this seems good');

      clickIfExists('[data-testid="close-labels-dropdown-button"]');
    } catch (err) {
      console.error('Label selection failed:', err);
    }
  },
  runAt: 'document_end',
});
