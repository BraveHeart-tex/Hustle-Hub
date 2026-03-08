import { type usePresets } from '@/lib/storage/reviewer-presets';
import { getGitlabUserAvatar } from '@/lib/utils/misc/getGitlabUserAvatar';
import { type GitlabReviewer } from '@/types/reviewer-presets';

import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '../ui/hover-card';

interface ReviewerChipWithPreviewProps {
  preset: ReturnType<typeof usePresets>['presets'][number];
  container: HTMLElement | null;
  isMatchingPreset: boolean;
  onSelect: (reviewers: (GitlabReviewer & { username: string })[]) => void;
}

export const ReviewerChipWithPreview = ({
  preset,
  container,
  isMatchingPreset,
  onSelect,
}: ReviewerChipWithPreviewProps) => {
  const onPresetClick = () => {
    onSelect(preset.reviewers as (GitlabReviewer & { username: string })[]);
  };

  return (
    <HoverCard openDelay={100} closeDelay={0}>
      <HoverCardTrigger asChild>
        <Button
          variant={isMatchingPreset ? 'default' : 'outline'}
          size="sm"
          className="rounded-full"
          onClick={onPresetClick}
        >
          {preset.label}
        </Button>
      </HoverCardTrigger>
      <HoverCardContent className="w-56 p-3" container={container} side="top">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          {preset.label}
        </p>
        <div className="flex flex-col gap-2">
          {preset.reviewers.map((reviewer) => (
            <div key={reviewer.gitlabId} className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={getGitlabUserAvatar(reviewer.gitlabId)} />
                <AvatarFallback className="text-[10px]">
                  {reviewer.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm">{reviewer.name}</span>
            </div>
          ))}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};
