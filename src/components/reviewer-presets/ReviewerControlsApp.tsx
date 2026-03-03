import '@/assets/tailwind.css';

import { UsersIcon } from 'lucide-react';
import { StrictMode } from 'react';

import { usePresets, useReviewers } from '@/lib/storage/reviewer-presets';
import { getGitlabUserAvatar } from '@/lib/utils/misc/getGitlabUserAvatar';
import { GitlabReviewer } from '@/types/reviewer-presets';

import { BottomRightPanel } from '../mr-thread-panel/BottomRightPanel';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { ReviewerChipWithPreview } from './ReviewerChipWithPreview';

const getCurrentReviewers = (
  reviewersContainer: HTMLElement | null,
): (GitlabReviewer & { username: string })[] => {
  if (!reviewersContainer) return [];
  return Array.from(
    reviewersContainer.querySelectorAll<HTMLInputElement>(
      'input[name="merge_request[reviewer_ids][]"]',
    ),
  )
    .map((input) => ({
      gitlabId: input.value,
      name: input.dataset.name ?? '',
      username: input.dataset.username ?? '',
    }))
    .filter((r) => Boolean(r.gitlabId) && r.gitlabId !== '0');
};

const injectReviewers = (
  reviewers: (GitlabReviewer & { username: string })[],
) => {
  const form =
    document.querySelector<HTMLFormElement>('form.new_merge_request') ||
    document.querySelector<HTMLFormElement>(
      'form.merge-request-form.js-quick-submit',
    );

  if (!form) return;

  // 1. Clear existing hidden inputs
  form
    .querySelectorAll<HTMLInputElement>(
      'input[name="merge_request[reviewer_ids][]"]',
    )
    .forEach((el) => el.remove());

  // 2. Find the dropdown container (the parent of the toggle button)
  const dropdownToggle = document.querySelector<HTMLElement>(
    '.js-reviewer-search.js-multiselect',
  );
  const dropdownContainer = dropdownToggle?.closest('.dropdown');

  // 3. Clear all is-active states in the reviewer dropdown
  dropdownContainer
    ?.querySelectorAll<HTMLElement>('.dropdown-content a.is-active')
    .forEach((el) => el.classList.remove('is-active'));

  reviewers.forEach((r) => {
    // 4. Add hidden input (same as GitLab's addInput method)
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'merge_request[reviewer_ids][]';
    input.value = r.gitlabId;
    // GitLab's addInput sets data attributes from the selectedObject keys
    input.dataset.name = r.name;
    input.dataset.username = r.username;
    input.dataset.avatarUrl = getGitlabUserAvatar(r.gitlabId);

    // Must be inserted BEFORE the dropdown (see: this.dropdown.before($input))
    if (!dropdownToggle?.parentElement?.insertBefore(input, dropdownToggle)) {
      form.appendChild(input);
    }

    // 5. Mark the corresponding list item as active
    // GitLab renders list items with data-user-id or matches by value
    const listItems = dropdownContainer?.querySelectorAll<HTMLElement>(
      '.dropdown-content li a',
    );
    listItems?.forEach((anchor) => {
      const li = anchor.parentElement;
      // GitLab stores the id in the input it would create, accessible via data-value or similar
      const itemValue =
        li?.dataset.value || li?.dataset.userId || anchor.dataset.value;
      if (
        itemValue === r.gitlabId ||
        itemValue === String(parseInt(r.gitlabId))
      ) {
        anchor.classList.add('is-active');
      }
    });
  });

  // 6. Trigger change on the form so GitLab's listeners pick it up
  dropdownToggle?.parentElement
    ?.querySelectorAll<HTMLInputElement>(
      'input[name="merge_request[reviewer_ids][]"]',
    )
    .forEach((input) =>
      input.dispatchEvent(new Event('change', { bubbles: true })),
    );

  // 7. Update the toggle label — GitLab calls updateLabel after rowClicked
  const labelEl = dropdownToggle?.querySelector('.dropdown-toggle-text');
  if (labelEl) {
    labelEl.textContent =
      reviewers.length > 0
        ? reviewers.map((r) => r.name).join(', ')
        : 'Select reviewers';
  }
};

export const ReviewerControlsApp = ({
  container,
}: {
  container: HTMLElement;
}) => {
  const [selectedReviewers, setSelectedReviewers] = useState<
    (GitlabReviewer & { username: string })[]
  >([]);
  const { presets } = usePresets();
  const { reviewers: allAvailableReviewers } = useReviewers();

  useEffect(() => {
    const reviewersContainer = document.querySelector<HTMLDivElement>(
      '.merge-request-reviewer .issuable-form-select-holder',
    );

    const observer = new MutationObserver(() => {
      setSelectedReviewers(getCurrentReviewers(reviewersContainer));
    });

    if (reviewersContainer) {
      setSelectedReviewers(getCurrentReviewers(reviewersContainer));

      observer.observe(reviewersContainer, { childList: true });
    }

    return () => observer.disconnect();
  }, [container]);

  const selectedIds = useMemo(
    () => new Set(selectedReviewers.map((r) => r.gitlabId)),
    [selectedReviewers],
  );

  const availableReviewers = useMemo(
    () => allAvailableReviewers.filter((r) => !selectedIds.has(r.gitlabId)),
    [allAvailableReviewers, selectedIds],
  );

  const handleAddReviewer = (
    reviewer: GitlabReviewer & { username: string },
  ) => {
    const updated = [...selectedReviewers, reviewer];
    setSelectedReviewers(updated);
    injectReviewers(updated);
  };

  const handleRemoveReviewer = (
    reviewer: GitlabReviewer & { username: string },
  ) => {
    const updated = selectedReviewers.filter(
      (r) => r.gitlabId !== reviewer.gitlabId,
    );
    setSelectedReviewers(updated);
    injectReviewers(updated);
  };

  const matchingPreset = useMemo(() => {
    if (selectedReviewers.length === 0) {
      return null;
    }

    const selectedIds = new Set(
      selectedReviewers.map((reviewer) => reviewer.gitlabId),
    );

    return presets.find(
      (preset) =>
        preset.reviewers.length === selectedIds.size &&
        preset.reviewers.every((reviewer) =>
          selectedIds.has(reviewer.gitlabId),
        ),
    );
  }, [presets, selectedReviewers]);

  const handlePresetSelect = (
    reviewers: (GitlabReviewer & { username: string })[],
  ) => {
    setSelectedReviewers(reviewers);
    injectReviewers(reviewers);
  };

  const hasNoPresets = presets.length === 0;
  const allReviewersSelected =
    availableReviewers.length === 0 && allAvailableReviewers.length > 0;

  return (
    <StrictMode>
      <BottomRightPanel>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full shadow-sm gap-1.5 h-auto py-1.5"
            >
              <UsersIcon className="h-3.5 w-3.5 shrink-0" />
              <div className="flex flex-col items-start leading-tight">
                <span className="text-xs">Reviewers & Presets</span>
                {selectedReviewers?.length > 0 && (
                  <span className="text-[10px] text-muted-foreground font-medium">
                    {selectedReviewers.length} selected
                  </span>
                )}
              </div>
            </Button>
          </PopoverTrigger>
          <PopoverContent
            container={container}
            side="top"
            align="end"
            className="w-auto max-w-2xl p-2 space-y-4"
          >
            {/* Presets row */}
            {presets.length > 0 && (
              <div className="flex items-center gap-2 flex-nowrap overflow-x-auto w-full">
                {presets.map((preset) => (
                  <ReviewerChipWithPreview
                    key={preset.id}
                    preset={preset}
                    container={container}
                    isMatchingPreset={matchingPreset?.id === preset.id}
                    onSelect={handlePresetSelect}
                  />
                ))}
              </div>
            )}

            {/* Available Reviewers */}
            <div className="grid gap-1.5">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Available Reviewers
              </span>
              {hasNoPresets ? (
                <p className="text-xs text-muted-foreground">
                  No reviewer presets defined yet. Add some in the extension
                  settings.
                </p>
              ) : allReviewersSelected ? (
                <p className="text-xs text-muted-foreground">
                  All available reviewers have been selected.
                </p>
              ) : (
                availableReviewers.map((reviewer) => (
                  <div
                    key={reviewer.gitlabId}
                    className="flex items-center gap-2 group cursor-pointer rounded px-1 hover:bg-muted transition-colors"
                    onClick={() =>
                      handleAddReviewer({ ...reviewer, username: '@undefined' })
                    }
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarImage
                        src={getGitlabUserAvatar(reviewer.gitlabId)}
                      />
                      <AvatarFallback className="text-[10px]">
                        {reviewer.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm flex-1">{reviewer.name}</span>
                    <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                      + add
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Selected Reviewers */}
            <div className="grid gap-1.5">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Selected Reviewers
              </span>
              {selectedReviewers.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  {hasNoPresets
                    ? 'No reviewers available to select.'
                    : 'None selected. Click a reviewer above or pick a preset.'}
                </p>
              ) : (
                selectedReviewers.map((selectedReviewer) => (
                  <div
                    key={selectedReviewer.gitlabId}
                    className="flex items-center gap-2 group cursor-pointer rounded px-1 hover:bg-destructive/10 transition-colors"
                    onClick={() => handleRemoveReviewer(selectedReviewer)}
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarImage
                        src={getGitlabUserAvatar(selectedReviewer.gitlabId)}
                      />
                      <AvatarFallback className="text-[10px]">
                        {selectedReviewer.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm flex-1">
                      {selectedReviewer.name}
                    </span>
                    <span className="text-[10px] text-destructive/60 opacity-0 group-hover:opacity-100 transition-opacity">
                      − remove
                    </span>
                  </div>
                ))
              )}
            </div>
          </PopoverContent>
        </Popover>
      </BottomRightPanel>
    </StrictMode>
  );
};
