import { Loader2, Pencil, Plus, Trash2, X } from 'lucide-react';
import { FormEvent, useRef, useState } from 'react';
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
  addReviewerPreset,
  removeReviewerPreset,
  updateReviewerPreset,
  usePresets,
  useReviewers,
} from '@/lib/storage/reviewer-presets';
import { GitlabReviewer, ReviewerPreset } from '@/types/reviewer-presets';

import GitlabIcon from '../misc/GitlabIcon';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

type FormMode = 'add' | 'edit';
const EMPTY_FORM = { name: '', users: [] as string[] };

const ReviewerAvatar = ({ reviewer }: { reviewer: GitlabReviewer }) => (
  <Avatar className="size-4">
    <AvatarImage
      src={`https://gitlab.com/uploads/-/system/user/avatar/${reviewer.gitlabId}/avatar.png`}
    />
    <AvatarFallback className="text-[8px]">
      {reviewer.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)}
    </AvatarFallback>
  </Avatar>
);

const PresetCard = ({
  preset,
  onEdit,
  onDelete,
}: {
  preset: ReviewerPreset & { reviewers: GitlabReviewer[] };
  onEdit: (preset: ReviewerPreset & { reviewers: GitlabReviewer[] }) => void;
  onDelete: (preset: ReviewerPreset) => void;
}) => (
  <div className="flex items-start justify-between rounded-lg border p-3 bg-muted/40 gap-3">
    <div className="flex flex-col gap-1.5 min-w-0">
      <span className="text-sm font-medium truncate">{preset.label}</span>
      <div className="flex flex-wrap gap-1">
        {preset.reviewers.length === 0 ? (
          <span className="text-xs text-muted-foreground italic">
            No reviewers
          </span>
        ) : (
          preset.reviewers.map((r) => (
            <Badge
              key={r.gitlabId}
              variant="secondary"
              className="gap-1 pr-1.5 text-xs"
            >
              <ReviewerAvatar reviewer={r} />
              {r.name}
            </Badge>
          ))
        )}
      </div>
    </div>
    <div className="flex items-center gap-1 shrink-0">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-7 text-muted-foreground hover:text-foreground"
        onClick={() => onEdit(preset)}
      >
        <Pencil className="size-3.5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-7 text-muted-foreground hover:text-destructive"
        onClick={() => onDelete(preset)}
      >
        <Trash2 className="size-3.5" />
      </Button>
    </div>
  </div>
);

export const ReviewerPresetsDialog = ({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (nextOpen: boolean) => void;
}) => {
  const { reviewers } = useReviewers();
  const { presets } = usePresets();

  const [mode, setMode] = useState<FormMode>('add');
  const [editingPreset, setEditingPreset] = useState<ReviewerPreset | null>(
    null,
  );
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [isLoading, setIsLoading] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const selectedReviewers = formData.users
    .map((id) => reviewers.find((r) => r.gitlabId === id))
    .filter(Boolean) as GitlabReviewer[];

  const availableReviewers = reviewers.filter(
    (r) => !formData.users.includes(r.gitlabId),
  );

  const resetForm = () => {
    setMode('add');
    setEditingPreset(null);
    setFormData(EMPTY_FORM);
  };

  const handleEditClick = (
    preset: ReviewerPreset & { reviewers: GitlabReviewer[] },
  ) => {
    setMode('edit');
    setEditingPreset(preset);
    setFormData({ name: preset.label, users: [...preset.users] });
    setTimeout(() => nameInputRef.current?.focus(), 50);
  };

  const handleDeleteClick = async (preset: ReviewerPreset) => {
    try {
      await removeReviewerPreset(preset);
      toast.success('Preset removed');
      if (editingPreset?.id === preset.id) resetForm();
    } catch {
      toast.error('Failed to remove preset');
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = formData.name.trim();
    if (!trimmedName) return;

    const duplicate = presets.find(
      (p) =>
        p.label.toLowerCase() === trimmedName.toLowerCase() &&
        p.id !== editingPreset?.id,
    );
    if (duplicate) {
      toast.error('A preset with this name already exists.');
      return;
    }

    setIsLoading(true);
    try {
      if (mode === 'add') {
        await addReviewerPreset({
          id: crypto.randomUUID(),
          label: trimmedName,
          users: formData.users,
        });
        toast.success('Preset added');
      } else {
        await updateReviewerPreset(editingPreset!.id, {
          ...editingPreset!,
          label: trimmedName,
          users: formData.users,
        });
        toast.success('Preset updated');
      }
      resetForm();
      nameInputRef.current?.focus();
    } catch {
      toast.error(
        mode === 'add' ? 'Failed to add preset' : 'Failed to update preset',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) resetForm();
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
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

        {presets.length === 0 ? (
          <div className="text-sm text-muted-foreground">No presets yet</div>
        ) : (
          <div className="grid gap-2 max-h-48 overflow-y-auto pr-1">
            {presets.map((preset) => (
              <PresetCard
                key={preset.id}
                preset={preset}
                onEdit={handleEditClick}
                onDelete={handleDeleteClick}
              />
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-2 border-t pt-4">
          {mode === 'edit' && (
            <p className="text-xs text-muted-foreground bg-muted rounded-md px-3 py-2">
              Editing{' '}
              <span className="font-medium text-foreground">
                {editingPreset?.label}
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
            <Label htmlFor="preset-name">Preset Name</Label>
            <Input
              id="preset-name"
              ref={nameInputRef}
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="e.g. Backend Team"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Reviewers</Label>

            {/* Selected reviewers */}
            {selectedReviewers.length > 0 && (
              <div className="flex flex-wrap gap-1.5 rounded-md border bg-muted/30 p-2 min-h-10">
                {selectedReviewers.map((r) => (
                  <div
                    key={r.gitlabId}
                    className="flex items-center gap-1.5 rounded-md border bg-background px-2 py-1 text-xs shadow-sm"
                  >
                    <ReviewerAvatar reviewer={r} />
                    <span className="font-medium">{r.name}</span>
                    <button
                      type="button"
                      className="ml-0.5 text-muted-foreground hover:text-destructive"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          users: prev.users.filter((id) => id !== r.gitlabId),
                        }))
                      }
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Available reviewers */}
            {availableReviewers.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {availableReviewers.map((r) => (
                  <button
                    key={r.gitlabId}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        users: [...prev.users, r.gitlabId],
                      }))
                    }
                    className="flex items-center gap-1.5 rounded-md border border-dashed bg-background px-2 py-1 text-xs text-muted-foreground hover:border-solid hover:text-foreground hover:bg-muted/50 transition-all"
                  >
                    <ReviewerAvatar reviewer={r} />
                    {r.name}
                    <Plus className="size-3" />
                  </button>
                ))}
              </div>
            )}

            {reviewers.length === 0 && (
              <p className="text-xs text-muted-foreground italic">
                No reviewers configured yet. Add reviewers first.
              </p>
            )}
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
            <Button type="submit" disabled={!formData.name.trim() || isLoading}>
              {isLoading && <Loader2 className="animate-spin" />}
              {isLoading
                ? mode === 'add'
                  ? 'Adding...'
                  : 'Saving...'
                : mode === 'add'
                  ? 'Add Preset'
                  : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
