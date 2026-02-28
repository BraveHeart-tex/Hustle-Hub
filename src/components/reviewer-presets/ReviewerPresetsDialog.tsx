import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import GitlabIcon from '../misc/GitlabIcon';

export const ReviewerPresetsDialog = ({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (nextOpen: boolean) => void;
}) => {
  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            <div className="flex items-center gap-2">
              <GitlabIcon />
              Reviewer Presets
            </div>
          </DialogTitle>
          <DialogDescription>
            Set your preferred reviewer presets here.
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};
