import { Settings } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import GitlabIcon from '../misc/GitlabIcon';
import { GitlabReviewersDialog } from '../reviewer-presets/GitlabReviewersDialog';
import { ReviewerPresetsDialog } from '../reviewer-presets/ReviewerPresetsDialog';

export const AppSettings = () => {
  const [dialog, setDialog] = useState<{
    isOpen: boolean;
    type: 'reviewers' | 'presets' | null;
  }>({
    isOpen: false,
    type: null,
  });

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            <Settings />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuGroup>
            <DropdownMenuLabel className="flex items-center gap-1">
              <GitlabIcon />
              Gitlab Settings
            </DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => setDialog({ isOpen: true, type: 'reviewers' })}
            >
              Reviewers
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setDialog({ isOpen: true, type: 'presets' })}
            >
              Reviewer Presets
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <GitlabReviewersDialog
        open={dialog.type === 'reviewers' && dialog.isOpen}
        onOpenChange={(isOpen) => {
          setDialog({ type: isOpen ? 'reviewers' : null, isOpen });
        }}
      />
      <ReviewerPresetsDialog
        open={dialog.type === 'presets' && dialog.isOpen}
        onOpenChange={(isOpen) => {
          setDialog({ type: isOpen ? 'presets' : null, isOpen });
        }}
      />
    </>
  );
};
