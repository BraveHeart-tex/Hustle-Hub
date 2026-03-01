import '@/assets/tailwind.css';

import { UsersIcon, XIcon } from 'lucide-react';
import { StrictMode } from 'react';

import { usePresets } from '@/lib/storage/reviewer-presets';
import { getGitlabUserAvatar } from '@/lib/utils/misc/getGitlabUserAvatar';
import { GitlabReviewer } from '@/types/reviewer-presets';

import { BottomRightPanel } from '../mr-thread-ui/BottomRightPanel';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { ReviewerChipWithPreview } from './ReviewerChipWithPreview';

const getCurrentReviewers = (
  reviewersContainer: HTMLElement | null,
): GitlabReviewer[] => {
  if (!reviewersContainer) return [];
  const inputs = reviewersContainer?.querySelectorAll<HTMLInputElement>(
    'input[name="merge_request[reviewer_ids][]"]',
  );
  if (!inputs) return [];
  return Array.from(inputs).map((input) => ({
    gitlabId: input.value || '',
    name: input.dataset.name || '',
  }));
};

export const ReviewerControlsApp = ({
  container,
}: {
  container: HTMLElement;
}) => {
  const [selectedReviewers, setSelectedReviewers] = useState<GitlabReviewer[]>(
    [],
  );
  const { presets } = usePresets();

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

  const handlePresetSelect = (reviewers: GitlabReviewer[]) => {
    setSelectedReviewers(reviewers);
  };

  return (
    <StrictMode>
      <BottomRightPanel>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full shadow-sm gap-1.5"
            >
              <UsersIcon className="h-3.5 w-3.5" />
              Reviewers & Presets
            </Button>
          </PopoverTrigger>
          <PopoverContent
            container={container}
            side="top"
            align="end"
            className="w-auto max-w-2xl p-2 space-y-4"
          >
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
            <div className="grid gap-1.5">
              <div className="mb-4">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Selected Reviewers
                </span>
                {selectedReviewers.length === 0 && (
                  <p className="text-xs text-muted-foreground">None selected</p>
                )}
              </div>
              {selectedReviewers.map((selectedReviewer) => (
                <div
                  key={selectedReviewer.gitlabId}
                  className="flex items-center gap-2 group"
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
                  <button
                    onClick={() =>
                      setSelectedReviewers((prev) =>
                        prev.filter(
                          (r) => r.gitlabId !== selectedReviewer.gitlabId,
                        ),
                      )
                    }
                    className="opacity-0 group-hover:opacity-100 transition-opacity rounded-full p-0.5 hover:bg-destructive/10 hover:text-destructive text-muted-foreground"
                  >
                    <XIcon className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </BottomRightPanel>
    </StrictMode>
  );
};
