import { Loader2 } from 'lucide-react';
import { FormEvent } from 'react';
import { toast } from 'sonner';

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  addGitlabReviewer,
  useReviewers,
} from '@/lib/storage/reviewer-presets';

import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { ReviewerActions } from './ReviewerActions';

export const GitlabReviewersDialog = ({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    gitlabId: '',
    name: '',
  });
  const gitlabIdInputRef = useRef<HTMLInputElement>(null);

  const { reviewers } = useReviewers();

  const handleReviewerSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (reviewers.find((reviewer) => reviewer.gitlabId === formData.gitlabId)) {
      toast.error('Reviewer already exists.');
      return;
    }

    setIsLoading(true);
    try {
      await addGitlabReviewer({
        gitlabId: formData.gitlabId,
        name: formData.name,
      });
      toast.success('Reviewer added successfully');
      setFormData({
        gitlabId: '',
        name: '',
      });
      gitlabIdInputRef.current?.focus();
    } catch (error) {
      console.error(error);
      toast.error('Failed to add reviewer');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setFormData({
        gitlabId: '',
        name: '',
      });
    }

    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gitlab Reviewers</DialogTitle>
          <DialogDescription>
            Select reviewers for your Gitlab project.
          </DialogDescription>
        </DialogHeader>

        {reviewers.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            No reviewers found
          </div>
        ) : (
          <div className="grid gap-2 max-h-48 overflow-y-auto pr-1">
            {reviewers.map((reviewer) => (
              <div
                key={reviewer.gitlabId}
                className="flex items-center justify-between rounded-lg border p-3 bg-muted/40"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="size-8">
                    <AvatarImage
                      src={`https://gitlab.com/uploads/-/system/user/avatar/${reviewer.gitlabId}/avatar.png`}
                    />
                    <AvatarFallback>
                      {reviewer.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{reviewer.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ID: {reviewer.gitlabId}
                    </span>
                  </div>
                </div>
                <ReviewerActions gitlabId={reviewer.gitlabId} />
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleReviewerSubmit} className="space-y-4 mt-4">
          <div className="space-y-1">
            <Label htmlFor="gitlabId">Gitlab ID</Label>
            <Input
              type="text"
              id="gitlabId"
              name="gitlabId"
              value={formData.gitlabId}
              onChange={(e) =>
                setFormData({ ...formData, gitlabId: e.target.value })
              }
              ref={gitlabIdInputRef}
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="name">Name</Label>
            <Input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isLoading}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={!formData.gitlabId || !formData.name || isLoading}
            >
              {isLoading && <Loader2 className="animate-spin" />}
              {isLoading ? 'Adding Reviewer...' : 'Add Reviewer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
