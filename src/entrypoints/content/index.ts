import { defineContentScript } from '#imports';
import { extractJiraId, waitForElement, waitForLabel } from '@/lib/utils';

export default defineContentScript({
  matches: ['*://*.gitlab.com/*/merge_requests/*'],
  main: async () => {
    const parsedUrl = new URL(document.location.toString());
    const params = new URLSearchParams(parsedUrl.search);
    const targetBranch = params.get('merge_request[target_branch]');

    if (targetBranch !== 'main') return;

    const sourceBranch = params.get('merge_request[source_branch]') || '';
    const specificElement = document.querySelector('#merge_request_title');

    if (!specificElement) {
      console.log('Specific element not found!');
      return;
    }

    if (specificElement instanceof HTMLInputElement) {
      specificElement.value = `Production Release for ${extractJiraId(
        sourceBranch,
      )}`;
    }

    const assignToMeLink = document.querySelector(
      '[data-testid="assign-to-me-link"]',
    );

    if (assignToMeLink && assignToMeLink instanceof HTMLAnchorElement) {
      assignToMeLink.click();
    }

    try {
      const reviewersDropdownButton = await waitForElement<HTMLButtonElement>(
        'button[data-field-name="merge_request[reviewer_ids][]"]',
        5000,
      );

      reviewersDropdownButton.click();
    } catch (err) {
      console.error('Reviewers dropdown button not found:', err);
      return;
    }

    try {
      const reviewer = await waitForElement<HTMLAnchorElement>(
        `li[data-user-id="${import.meta.env.VITE_RELEASE_REVIEWER_USER_ID}"] a`,
      );

      if (reviewer) {
        reviewer.click();
        console.log(
          `✅ Reviewer ${import.meta.env.VITE_RELEASE_REVIEWER_USER_ID} selected.`,
        );

        const closeIcon = document.querySelector('[data-testid="close-icon"]');

        if (
          closeIcon &&
          'click' in closeIcon &&
          typeof closeIcon.click === 'function'
        ) {
          closeIcon.click();
        }
      }
    } catch (error) {
      console.error('Reviewer selection failed:', error);
    }

    try {
      const dropdownBtn = await waitForElement<HTMLButtonElement>(
        '[data-testid="issuable-label-dropdown"]',
        5000,
      );

      dropdownBtn.click();
    } catch (err) {
      console.error('Dropdown button not found:', err);
      return;
    }

    try {
      const labelButton = await waitForLabel('target::production', 5000);
      labelButton.click();
      console.log(`✅ Label target::production selected.`);

      const closeButton = document.querySelector(
        '[data-testid="close-labels-dropdown-button"]',
      ) as HTMLButtonElement;

      if (closeButton) {
        closeButton.click();
      }
    } catch (err) {
      console.error('Label selection failed:', err);
    }
  },
  runAt: 'document_end',
});
