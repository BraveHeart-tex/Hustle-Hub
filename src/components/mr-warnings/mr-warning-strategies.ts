export interface MrWarning {
  id: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

interface BranchStrategy {
  label: string;
  checks: ((doc: Document) => MrWarning | null)[];
}

const getReviewers = (doc: Document): string[] => {
  return Array.from(
    doc.querySelectorAll<HTMLInputElement>(
      'input[name="merge_request[reviewer_ids][]"]',
    ),
  )
    .map((input) => input.value)
    .filter((r) => Boolean(r));
};

export const mrWarningStrategies: Record<string, BranchStrategy> = {
  main: {
    label: 'Release MR',
    checks: [
      (doc) => {
        const reviewerIds = getReviewers(doc);
        const requiredId =
          import.meta.env.VITE_RELEASE_REVIEWER_USER_ID?.toString();

        return !reviewerIds.includes(requiredId)
          ? {
              id: 'missing-release-reviewer',
              severity: 'error',
              message: 'Release reviewer is not selected.',
            }
          : null;
      },
      (doc) => {
        const selectedLabels = Array.from(
          doc.querySelectorAll<HTMLElement>(
            '[data-testid="selected-label-content"]',
          ),
        )
          .map((el) => el.dataset.qaLabelName ?? '')
          .filter(Boolean);

        return !selectedLabels.includes('target::production')
          ? {
              id: 'missing-production-label',
              severity: 'error',
              message: 'target::production label is not selected.',
            }
          : null;
      },
      (doc) => {
        const checks = Array.from(
          doc.querySelectorAll<HTMLElement>(
            '[data-testid="merge-checks-full"] [data-testid="merge-check"]',
          ),
        ).map((el) => el.textContent?.trim() ?? '');

        const requiresApprovals = checks.some((text) =>
          text.includes('All required approvals must be given'),
        );

        return requiresApprovals
          ? {
              id: 'missing-approvals',
              severity: 'error',
              message: 'All required approvals must be given.',
            }
          : null;
      },
      (doc) => {
        const description =
          doc.querySelector<HTMLTextAreaElement>(
            '[data-testid="description-content"] .js-task-list-field',
          )?.dataset.value ?? '';
        const hasFerelLink =
          /https:\/\/letgotr\.atlassian\.net\/browse\/FEREL-\d+/.test(
            description,
          );
        return !hasFerelLink
          ? {
              id: 'missing-ferel-link',
              severity: 'error',
              message: 'FEREL task link is missing from the description.',
            }
          : null;
      },

      (doc) => {
        const checks = Array.from(
          doc.querySelectorAll<HTMLElement>(
            '[data-testid="merge-checks-full"] [data-testid="merge-check"]',
          ),
        ).map((el) => el.textContent?.trim() ?? '');

        const hasConflicts = checks.some((text) =>
          text.includes('Merge conflicts must be resolved'),
        );
        return hasConflicts
          ? {
              id: 'merge-conflicts',
              severity: 'error',
              message: 'Merge conflicts must be resolved before merging.',
            }
          : null;
      },

      (doc) => {
        const isDraft = doc
          .querySelector('[data-testid="title-content"]')
          ?.textContent?.toLowerCase()
          .startsWith('draft');
        return isDraft
          ? {
              id: 'draft-title',
              severity: 'warning',
              message: 'MR is still in draft state.',
            }
          : null;
      },
      (doc) => {
        const isBehind = doc.querySelector('[data-testid="rebase-button"]');
        return isBehind
          ? {
              id: 'behind-target',
              severity: 'error',
              message: 'Source branch is behind main. Rebase before merging.',
            }
          : null;
      },
    ],
  },
  develop: {
    label: 'Feature MR',
    checks: [
      (doc) => {
        const checks = Array.from(
          doc.querySelectorAll<HTMLElement>(
            '[data-testid="merge-checks-full"] [data-testid="merge-check"]',
          ),
        ).map((el) => el.textContent?.trim() ?? '');

        const requiresApprovals = checks.some((text) =>
          text.includes('All required approvals must be given'),
        );

        return requiresApprovals
          ? {
              id: 'missing-approvals',
              severity: 'error',
              message: 'All required approvals must be given.',
            }
          : null;
      },
      (doc) => {
        const reviewers = getReviewers(doc);
        return reviewers.length === 0
          ? {
              id: 'empty-reviewers',
              severity: 'error',
              message: 'No reviewers assigned to the MR.',
            }
          : null;
      },
      (doc) => {
        const checks = Array.from(
          doc.querySelectorAll<HTMLElement>(
            '[data-testid="merge-checks-full"] [data-testid="merge-check"]',
          ),
        ).map((el) => el.textContent?.trim() ?? '');

        const hasConflicts = checks.some((text) =>
          text.includes('Merge conflicts must be resolved'),
        );
        return hasConflicts
          ? {
              id: 'merge-conflicts',
              severity: 'error',
              message: 'Merge conflicts must be resolved before merging.',
            }
          : null;
      },
      (doc) => {
        const isDraft = doc
          .querySelector('[data-testid="title-content"]')
          ?.textContent?.toLowerCase()
          .startsWith('draft');
        return isDraft
          ? {
              id: 'draft-title',
              severity: 'warning',
              message: 'MR is still in draft state.',
            }
          : null;
      },
      (doc) => {
        const isBehind = doc.querySelector('[data-testid="rebase-button"]');
        return isBehind
          ? {
              id: 'behind-target',
              severity: 'warning',
              message: 'Source branch is behind main. Rebase before merging.',
            }
          : null;
      },
    ],
  },
};
