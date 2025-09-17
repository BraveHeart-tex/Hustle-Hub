import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { NOTE_PRIORITIES, NotePriority } from '@/lib/constants';
import { addNote, updateNote } from '@/lib/storage/notes';
import { Note } from '@/types/notes';

interface NoteFormDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  selectedItem?: Note;
}

const defaultFormState: Note = {
  id: '',
  title: '',
  content: '',
  priority: NOTE_PRIORITIES.LOW,
};

const NoteFormDialog = ({
  isOpen,
  onOpenChange,
  selectedItem,
}: NoteFormDialogProps) => {
  const [formState, setFormState] = useState<Note>(defaultFormState);

  useEffect(() => {
    if (!isOpen) {
      setFormState(defaultFormState);
    }
  }, [isOpen, selectedItem]);

  useEffect(() => {
    if (isOpen && selectedItem) {
      setFormState(selectedItem);
    }
  }, [isOpen, selectedItem]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!formState.title) {
      return;
    }

    if (!formState.id) {
      await addNote({
        ...formState,
        id: crypto.randomUUID(),
      });
    } else {
      await updateNote(formState.id, formState);
    }

    toast.success('Note saved successfully');
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild></DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{formState.id ? 'Edit Note' : 'New Note'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col gap-2 group">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              type="text"
              placeholder="Title"
              value={formState.title}
              onChange={(e) =>
                setFormState({ ...formState, title: e.target.value })
              }
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              placeholder="Content"
              value={formState.content}
              onChange={(e) =>
                setFormState({ ...formState, content: e.target.value })
              }
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="priority">Priority</Label>
            <Select
              defaultValue={formState.priority}
              onValueChange={(v) =>
                setFormState({ ...formState, priority: v as NotePriority })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(NOTE_PRIORITIES).map((priorityKey) => (
                  <SelectItem
                    key={priorityKey}
                    value={
                      NOTE_PRIORITIES[
                        priorityKey as keyof typeof NOTE_PRIORITIES
                      ]
                    }
                  >
                    {priorityKey.charAt(0).toUpperCase() +
                      priorityKey.toLowerCase().slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {formState.id !== '' && (
            <div className="flex items-center gap-2">
              <Checkbox
                id="completed"
                checked={formState.completed}
                onCheckedChange={(state) => {
                  setFormState({ ...formState, completed: Boolean(state) });
                }}
              />
              <Label htmlFor="completed">Completed</Label>
            </div>
          )}
          <Button type="submit" className="w-full" disabled={!formState.title}>
            Save
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
export default NoteFormDialog;
