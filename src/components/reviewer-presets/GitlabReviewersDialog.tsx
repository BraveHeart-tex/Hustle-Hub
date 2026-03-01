import { Loader2, Pencil } from 'lucide-react';
import { FormEvent, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  addGitlabReviewer,
  updateGitlabReviewer,
  useReviewers,
} from '@/lib/storage/reviewer-presets';
import { cn } from '@/lib/utils';
import { getGitlabUserAvatar } from '@/lib/utils/misc/getGitlabUserAvatar';

import GitlabIcon from '../misc/GitlabIcon';
import { ReviewerActions } from './ReviewerActions';

type FormMode = 'add' | 'edit';

const EMPTY_FORM = { gitlabId: '', name: '' };

export const GitlabReviewersDialog = ({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<FormMode>('add');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const gitlabIdInputRef = useRef<HTMLInputElement>(null);
  const { reviewers } = useReviewers();

  const resetForm = () => {
    setMode('add');
    setEditingId(null);
    setFormData(EMPTY_FORM);
  };

  const handleEditClick = (reviewer: { gitlabId: string; name: string }) => {
    setMode('edit');
    setEditingId(reviewer.gitlabId);
    setFormData({ gitlabId: reviewer.gitlabId, name: reviewer.name });
    gitlabIdInputRef.current?.focus();
  };

  const handleReviewerSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (mode === 'add') {
      const duplicate = reviewers.find((r) => r.gitlabId === formData.gitlabId);
      if (duplicate) {
        toast.error('A reviewer with this Gitlab ID already exists.');
        return;
      }

      setIsLoading(true);
      try {
        await addGitlabReviewer({
          gitlabId: formData.gitlabId,
          name: formData.name,
        });
        toast.success('Reviewer added successfully');
        resetForm();
        gitlabIdInputRef.current?.focus();
      } catch (error) {
        console.error(error);
        toast.error('Failed to add reviewer');
      } finally {
        setIsLoading(false);
      }
    } else {
      // Edit mode — check for duplicate gitlabId only if it changed
      const idChanged = formData.gitlabId !== editingId;
      if (idChanged) {
        const duplicate = reviewers.find(
          (r) => r.gitlabId === formData.gitlabId,
        );
        if (duplicate) {
          toast.error('A reviewer with this Gitlab ID already exists.');
          return;
        }
      }

      setIsLoading(true);
      try {
        await updateGitlabReviewer(editingId!, {
          gitlabId: formData.gitlabId,
          name: formData.name,
        });
        toast.success('Reviewer updated successfully');
        resetForm();
      } catch (error) {
        console.error(error);
        toast.error('Failed to update reviewer');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) resetForm();
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            <div className="flex items-center gap-2">
              <GitlabIcon />
              Gitlab Reviewers
            </div>
          </DialogTitle>
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
                className={cn(
                  'flex items-center justify-between rounded-lg border p-3 bg-muted/40 transition-colors',
                  editingId === reviewer.gitlabId
                    ? 'border-primary bg-primary/5'
                    : '',
                )}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="size-8">
                    <AvatarImage src={getGitlabUserAvatar(reviewer.gitlabId)} />
                    <AvatarFallback>
                      {reviewer.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{reviewer.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ID: {reviewer.gitlabId}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 text-muted-foreground hover:text-foreground"
                    onClick={() => handleEditClick(reviewer)}
                    disabled={isLoading}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <ReviewerActions gitlabId={reviewer.gitlabId} />
                </div>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleReviewerSubmit} className="space-y-4 mt-4">
          {mode === 'edit' && (
            <p className="text-xs text-muted-foreground bg-muted rounded-md px-3 py-2">
              Editing reviewer{' '}
              <span className="font-medium text-foreground">
                {reviewers.find((r) => r.gitlabId === editingId)?.name}
              </span>
              .{' '}
              <button
                type="button"
                className="underline hover:text-foreground"
                onClick={resetForm}
              >
                Cancel edit
              </button>
            </p>
          )}

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
                Close
              </Button>
            </DialogClose>
            {mode === 'edit' && (
              <Button
                type="button"
                variant="ghost"
                disabled={isLoading}
                onClick={resetForm}
              >
                Cancel Edit
              </Button>
            )}
            <Button
              type="submit"
              disabled={!formData.gitlabId || !formData.name || isLoading}
            >
              {isLoading && <Loader2 className="animate-spin" />}
              {isLoading
                ? mode === 'add'
                  ? 'Adding...'
                  : 'Saving...'
                : mode === 'add'
                  ? 'Add Reviewer'
                  : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
