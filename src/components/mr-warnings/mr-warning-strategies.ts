export interface MrWarning {
  id: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

interface BranchStrategy {
  label: string;
  checks: ((doc: Document) => MrWarning | null)[];
}

const getReviewers = (doc: Document): string[] =>
  Array.from(
    doc.querySelectorAll<HTMLInputElement>(
      'input[name="merge_request[reviewer_ids][]"]',
    ),
  )
    .map((input) => input.value)
    .filter(Boolean);

const getMergeCheckTexts = (doc: Document): string[] =>
  Array.from(
    doc.querySelectorAll<HTMLElement>(
      '[data-testid="merge-checks-full"] [data-testid="merge-check"]',
    ),
  ).map((el) => el.textContent?.trim() ?? '');

// --- Shared checks ---

const checkDraft = (doc: Document): MrWarning | null => {
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
};

const checkConflicts = (doc: Document): MrWarning | null => {
  const hasConflicts = getMergeCheckTexts(doc).some((t) =>
    t.includes('Merge conflicts must be resolved'),
  );
  return hasConflicts
    ? {
        id: 'merge-conflicts',
        severity: 'error',
        message: 'Merge conflicts must be resolved before merging.',
      }
    : null;
};

const checkApprovals = (doc: Document): MrWarning | null => {
  const missing = getMergeCheckTexts(doc).some((t) =>
    t.includes('All required approvals must be given'),
  );
  return missing
    ? {
        id: 'missing-approvals',
        severity: 'error',
        message: 'All required approvals must be given.',
      }
    : null;
};

const checkBehindTarget =
  (severity: MrWarning['severity']) =>
  (doc: Document): MrWarning | null => {
    const isBehind = doc.querySelector('[data-testid="rebase-button"]');
    return isBehind
      ? {
          id: 'behind-target',
          severity,
          message: 'Source branch is behind target. Rebase before merging.',
        }
      : null;
  };

export const mrWarningStrategies: Record<string, BranchStrategy> = {
  main: {
    label: 'Release MR',
    checks: [
      (doc) => {
        const requiredId =
          import.meta.env.VITE_RELEASE_REVIEWER_USER_ID?.toString();
        return !getReviewers(doc).includes(requiredId)
          ? {
              id: 'missing-release-reviewer',
              severity: 'error',
              message: 'Release reviewer is not selected.',
            }
          : null;
      },
      (doc) => {
        const labels = Array.from(
          doc.querySelectorAll<HTMLElement>(
            '[data-testid="selected-label-content"]',
          ),
        )
          .map((el) => el.dataset.qaLabelName ?? '')
          .filter(Boolean);
        return !labels.includes('target::production')
          ? {
              id: 'missing-production-label',
              severity: 'error',
              message: 'target::production label is not selected.',
            }
          : null;
      },
      (doc) => {
        const description =
          doc.querySelector<HTMLTextAreaElement>(
            '[data-testid="description-content"] .js-task-list-field',
          )?.dataset.value ?? '';
        return !/https:\/\/letgotr\.atlassian\.net\/browse\/FEREL-\d+/.test(
          description,
        )
          ? {
              id: 'missing-ferel-link',
              severity: 'error',
              message: 'FEREL task link is missing from the description.',
            }
          : null;
      },
      checkApprovals,
      checkConflicts,
      checkDraft,
      checkBehindTarget('error'),
    ],
  },
  develop: {
    label: 'Feature MR',
    checks: [
      (doc) => {
        return getReviewers(doc).length === 0
          ? {
              id: 'empty-reviewers',
              severity: 'error',
              message: 'No reviewers assigned to the MR.',
            }
          : null;
      },
      checkApprovals,
      checkConflicts,
      checkDraft,
      checkBehindTarget('warning'),
    ],
  },
};
