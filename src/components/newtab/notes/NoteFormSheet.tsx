import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import RichTextEditor from '@/components/ui/rich-text-editor';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
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

const RESET_DELAY_MS = 100;

const NoteFormSheet = ({
  isOpen,
  onOpenChange,
  selectedItem,
}: NoteFormDialogProps) => {
  const [formState, setFormState] = useState<Note>(defaultFormState);
  const formResetTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    if (!isOpen) {
      formResetTimeoutRef.current = setTimeout(() => {
        setFormState(defaultFormState);
      }, RESET_DELAY_MS);
    }

    return () => {
      if (formResetTimeoutRef.current !== null) {
        clearTimeout(formResetTimeoutRef.current);
        formResetTimeoutRef.current = null;
      }
    };
  }, [isOpen]);

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
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>{formState.id ? 'Edit Note' : 'New Note'}</SheetTitle>
          <SheetDescription>
            {formState.id ? 'Edit an existing note' : 'Create a new note'}
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-6 overflow-auto px-4">
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
            <RichTextEditor
              content={formState.content}
              onChange={(content) => {
                setFormState({ ...formState, content });
              }}
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
        </form>
        <SheetFooter>
          <Button
            type="button"
            className="w-full"
            disabled={!formState.title}
            onClick={handleSubmit}
          >
            Save
          </Button>
          <SheetClose asChild>
            <Button type="button" variant="secondary">
              Cancel
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
export default NoteFormSheet;
