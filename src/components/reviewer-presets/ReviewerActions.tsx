import { PopoverClose } from '@radix-ui/react-popover';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { removeGitlabReviewer } from '@/lib/storage/reviewer-presets';

export const ReviewerActions = ({ gitlabId }: { gitlabId: string }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await removeGitlabReviewer(gitlabId);
    } catch (error) {
      console.error(error);
      toast.error('Something went wrong while deleting the reviewer', {
        description: String(error),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button size="icon" variant="ghost">
          <Trash2 className="size-4 text-destructive" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 space-y-3">
        <p className="text-sm">Delete this reviewer?</p>
        <div className="flex justify-end gap-2">
          <PopoverClose>
            <Button size="sm" variant="outline" disabled={isLoading}>
              Cancel
            </Button>
          </PopoverClose>
          <Button
            size="sm"
            variant="destructive"
            disabled={isLoading}
            onClick={handleDelete}
          >
            Delete
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
