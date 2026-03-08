import { Loader2, Pencil, PlusIcon, UserIcon } from 'lucide-react';
import { type FormEvent, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
    setTimeout(() => gitlabIdInputRef.current?.focus(), 50);
  };

  const handleEditClick = (reviewer: { gitlabId: string; name: string }) => {
    setMode('edit');
    setEditingId(reviewer.gitlabId);
    setFormData({ gitlabId: reviewer.gitlabId, name: reviewer.name });
    setTimeout(() => gitlabIdInputRef.current?.focus(), 50);
  };

  const handleReviewerSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (mode === 'add') {
      const duplicate = reviewers.find((r) => r.gitlabId === formData.gitlabId);
      if (duplicate) {
        toast.error('A reviewer with this GitLab ID already exists.');
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
      } catch {
        toast.error('Failed to add reviewer');
      } finally {
        setIsLoading(false);
      }
    } else {
      const idChanged = formData.gitlabId !== editingId;
      if (idChanged) {
        const duplicate = reviewers.find(
          (r) => r.gitlabId === formData.gitlabId,
        );
        if (duplicate) {
          toast.error('A reviewer with this GitLab ID already exists.');
          return;
        }
      }
      setIsLoading(true);
      try {
        await updateGitlabReviewer(editingId!, {
          gitlabId: formData.gitlabId,
          name: formData.name,
        });
        toast.success('Reviewer updated');
        resetForm();
      } catch {
        toast.error('Failed to update reviewer');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && !isLoading) {
      resetForm();
      onOpenChange(false);
    } else if (nextOpen) {
      onOpenChange(true);
    }
  };

  const editingReviewer = reviewers.find((r) => r.gitlabId === editingId);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-5 pt-5 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
              <GitlabIcon className="h-4 w-4" />
            </div>
            GitLab Reviewers
          </DialogTitle>
          <DialogDescription>
            Manage your GitLab reviewer presets.
          </DialogDescription>
        </DialogHeader>

        {/* Reviewer list */}
        <div className="px-5 py-4 border-b">
          {reviewers.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                <UserIcon className="h-5 w-5 text-muted-foreground/40" />
              </div>
              <p className="text-sm text-muted-foreground">No reviewers yet.</p>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto -mx-1 px-1">
              {reviewers.map((reviewer) => {
                const isEditing = editingId === reviewer.gitlabId;
                return (
                  <div
                    key={reviewer.gitlabId}
                    className={cn(
                      'flex items-center justify-between rounded-lg px-3 py-2 transition-colors',
                      isEditing
                        ? 'bg-primary/5 ring-1 ring-primary/20'
                        : 'bg-muted/40 hover:bg-muted/70',
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar className="size-7 shrink-0">
                        <AvatarImage
                          src={getGitlabUserAvatar(reviewer.gitlabId)}
                        />
                        <AvatarFallback className="text-[10px]">
                          {reviewer.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {reviewer.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          ID: {reviewer.gitlabId}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className={cn(
                          'size-7 transition-colors',
                          isEditing
                            ? 'text-primary'
                            : 'text-muted-foreground hover:text-foreground',
                        )}
                        onClick={() =>
                          isEditing ? resetForm() : handleEditClick(reviewer)
                        }
                        disabled={isLoading}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <ReviewerActions gitlabId={reviewer.gitlabId} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleReviewerSubmit} className="px-5 py-4 space-y-3">
          {/* Mode indicator */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {mode === 'add' ? (
                <PlusIcon className="h-3.5 w-3.5 text-muted-foreground" />
              ) : (
                <Pencil className="h-3.5 w-3.5 text-primary" />
              )}
              <span className="text-xs font-medium text-muted-foreground">
                {mode === 'add'
                  ? 'Add reviewer'
                  : `Editing ${editingReviewer?.name ?? ''}`}
              </span>
            </div>
            {mode === 'edit' && (
              <button
                type="button"
                onClick={resetForm}
                className="text-[11px] text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="gitlabId" className="text-xs">
                GitLab ID
              </Label>
              <Input
                type="text"
                id="gitlabId"
                name="gitlabId"
                value={formData.gitlabId}
                onChange={(e) =>
                  setFormData({ ...formData, gitlabId: e.target.value })
                }
                ref={gitlabIdInputRef}
                className="h-8 text-sm"
                placeholder="e.g. 28408582"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs">
                Display Name
              </Label>
              <Input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="h-8 text-sm"
                placeholder="e.g. Bora Karaca"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8"
              disabled={isLoading}
              onClick={() => handleOpenChange(false)}
            >
              Close
            </Button>
            <Button
              type="submit"
              size="sm"
              className="h-8 min-w-24"
              disabled={!formData.gitlabId || !formData.name || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {mode === 'add' ? 'Adding...' : 'Saving...'}
                </>
              ) : mode === 'add' ? (
                <>
                  <PlusIcon className="h-3.5 w-3.5" />
                  Add
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
