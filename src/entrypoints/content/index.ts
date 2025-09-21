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

    let dropdownBtn;
    try {
      dropdownBtn = await waitForElement<HTMLButtonElement>(
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
