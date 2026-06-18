import { Settings, Terminal } from 'lucide-react';

import { GitlabIcon } from '@/components/misc/GitlabIcon';
import { StrictReviewTemplateDialog } from '@/components/newtab/StrictReviewTemplateDialog';
import { GitlabReviewersDialog } from '@/components/reviewer-presets/GitlabReviewersDialog';
import { ReviewerPresetsDialog } from '@/components/reviewer-presets/ReviewerPresetsDialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type DialogType = 'reviewers' | 'presets' | 'strict-review-template';

export const AppSettings = () => {
  const [dialog, setDialog] = useState<{
    isOpen: boolean;
    type: DialogType | null;
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
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuLabel className="flex items-center gap-1">
              <Terminal className="size-4" />
              Prompts
            </DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() =>
                setDialog({ isOpen: true, type: 'strict-review-template' })
              }
            >
              Strict Review Template
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
      <StrictReviewTemplateDialog
        open={dialog.type === 'strict-review-template' && dialog.isOpen}
        onOpenChange={(isOpen) => {
          setDialog({
            type: isOpen ? 'strict-review-template' : null,
            isOpen,
          });
        }}
      />
    </>
  );
};
