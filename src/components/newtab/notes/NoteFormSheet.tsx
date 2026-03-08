import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import EditorSkeleton from '@/components/ui/editor-skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { NOTE_PRIORITIES, type NotePriority } from '@/lib/constants';
import { addNote, updateNote } from '@/lib/storage/notes';
import { type Note } from '@/types/notes';

const RichTextEditor = lazy(() => import('@/components/ui/rich-text-editor'));

interface NoteFormSheetProps {
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

const PRIORITY_OPTIONS = Object.entries(NOTE_PRIORITIES).map(
  ([key, value]) => ({
    label: key.charAt(0).toUpperCase() + key.toLowerCase().slice(1),
    value,
  }),
);

const NoteFormSheet = ({
  isOpen,
  onOpenChange,
  selectedItem,
}: NoteFormSheetProps) => {
  const [formState, setFormState] = useState<Note>(defaultFormState);
  const lastToastId = useRef<string | number | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (isOpen && selectedItem) {
      setFormState(selectedItem);
    }
  }, [isOpen, selectedItem]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!formState.title.trim()) {
      lastToastId.current = toast.error('Please enter a title', {
        id: lastToastId.current ?? undefined,
      });
      return;
    }

    if (!formState.id) {
      await addNote({ ...formState, id: crypto.randomUUID() });
    } else {
      await updateNote(formState.id, formState);
    }

    toast.success('Note saved successfully');
    onOpenChange(false);
  };

  const isEditing = Boolean(formState.id);

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent
        className="sm:max-w-2xl"
        onCloseAutoFocus={() => {
          setFormState(defaultFormState);
        }}
      >
        <SheetHeader>
          <SheetTitle>{isEditing ? 'Edit Note' : 'New Note'}</SheetTitle>
          <SheetDescription>
            {isEditing ? 'Edit an existing note' : 'Create a new note'}
          </SheetDescription>
        </SheetHeader>
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="space-y-6 overflow-auto px-4"
        >
          <div className="flex flex-col gap-2">
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
            <Suspense fallback={<EditorSkeleton />}>
              <RichTextEditor
                content={formState.content}
                onChange={(content) => setFormState({ ...formState, content })}
                onCmdEnter={() => formRef.current?.requestSubmit()}
              />
            </Suspense>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="priority">Priority</Label>
            {/* Use `value` not `defaultValue` so the select reflects edits correctly */}
            <Select
              value={formState.priority}
              onValueChange={(v) =>
                setFormState({ ...formState, priority: v as NotePriority })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                {PRIORITY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
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
            disabled={!formState.title.trim()}
            onClick={() => formRef.current?.requestSubmit()}
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
