import { FileText } from 'lucide-react';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import EditorSkeleton from '@/components/ui/editor-skeleton';
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
  SheetFooter,
} from '@/components/ui/sheet';
import { NOTE_PRIORITIES, type NotePriority } from '@/lib/constants';
import { addNote, updateNote } from '@/lib/storage/notes';
import { cn } from '@/lib/utils';
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

const PRIORITY_CONFIG: Record<
  NotePriority,
  { dot: string; label: string; pill: string }
> = {
  [NOTE_PRIORITIES.LOW]: {
    dot: 'bg-sky-400',
    label: 'Low',
    pill: 'bg-sky-500/10 text-sky-500 border-sky-500/20',
  },
  [NOTE_PRIORITIES.MEDIUM]: {
    dot: 'bg-amber-400',
    label: 'Medium',
    pill: 'bg-amber-400/10 text-amber-400 border-amber-400/20',
  },
  [NOTE_PRIORITIES.HIGH]: {
    dot: 'bg-rose-500 shadow-[0_0_6px_1px_rgba(244,63,94,0.5)]',
    label: 'High',
    pill: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
  },
};

const NoteFormSheet = ({
  isOpen,
  onOpenChange,
  selectedItem,
}: NoteFormSheetProps) => {
  const [formState, setFormState] = useState<Note>(defaultFormState);
  const lastToastId = useRef<string | number | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const titleRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      setFormState(selectedItem ?? defaultFormState);
      // Focus title after sheet opens
      setTimeout(() => titleRef.current?.focus(), 150);
    }
  }, [isOpen, selectedItem]);

  const handleSubmit = async (event?: React.FormEvent) => {
    event?.preventDefault();
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
    toast.success('Note saved');
    onOpenChange(false);
  };

  const isEditing = Boolean(formState.id);
  const priorityCfg =
    PRIORITY_CONFIG[formState.priority] ?? PRIORITY_CONFIG[NOTE_PRIORITIES.LOW];

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent
        className="sm:max-w-xl flex flex-col gap-0 p-0 overflow-hidden"
        onCloseAutoFocus={() => setFormState(defaultFormState)}
      >
        {/* Header */}
        <div className="flex items-center gap-2.5 px-5 py-3 border-b bg-muted/30 shrink-0">
          <FileText size={13} className="text-muted-foreground/50 shrink-0" />
          <span className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-widest">
            {isEditing ? 'Edit Note' : 'New Note'}
          </span>
        </div>

        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto flex flex-col min-h-0"
        >
          {/* Title — auto-resizing textarea, feels like typing directly */}
          <div className="px-5 pt-5 pb-2">
            <textarea
              ref={titleRef}
              placeholder="Untitled"
              value={formState.title}
              rows={1}
              className={cn(
                'w-full resize-none bg-transparent border-none outline-none shadow-none',
                'text-xl font-semibold leading-snug placeholder:text-muted-foreground/30',
                'overflow-hidden',
              )}
              onChange={(e) => {
                // Auto-resize
                e.target.style.height = 'auto';
                e.target.style.height = `${e.target.scrollHeight}px`;
                setFormState({ ...formState, title: e.target.value });
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  // Move focus to editor
                }
              }}
            />
          </div>

          {/* Metadata row — always visible, inline select */}
          <div className="px-5 py-2 flex items-center gap-3">
            <span className="text-[11px] text-muted-foreground/50 font-medium shrink-0">
              Priority
            </span>
            <Select
              value={formState.priority}
              onValueChange={(v) =>
                setFormState({ ...formState, priority: v as NotePriority })
              }
            >
              <SelectTrigger
                className={cn(
                  'h-6 border rounded-full px-2.5 text-[11px] font-medium gap-1.5 w-auto shadow-none focus:ring-0',
                  priorityCfg.pill,
                )}
              >
                <span
                  className={cn(
                    'h-1.5 w-1.5 rounded-full shrink-0',
                    priorityCfg.dot,
                  )}
                />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITY_OPTIONS.map((opt) => (
                  <SelectItem
                    key={opt.value}
                    value={opt.value}
                    className="text-xs"
                  >
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Content — editor always mounted, no toggle */}
          <div className="flex-1 min-h-0">
            <Suspense fallback={<EditorSkeleton />}>
              <RichTextEditor
                content={formState.content}
                onChange={(content) => setFormState({ ...formState, content })}
                onCmdEnter={() => formRef.current?.requestSubmit()}
                placeholder="Start writing…"
              />
            </Suspense>
          </div>
        </form>

        {/* Footer */}
        <SheetFooter className="border-t px-5 py-3.5 flex-row gap-2 shrink-0">
          <Button
            type="button"
            className="flex-1"
            disabled={!formState.title.trim()}
            onClick={() => handleSubmit()}
          >
            {isEditing ? 'Save changes' : 'Save note'}
          </Button>
          <SheetClose asChild>
            <Button type="button" variant="outline" className="shrink-0">
              Cancel
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default NoteFormSheet;
