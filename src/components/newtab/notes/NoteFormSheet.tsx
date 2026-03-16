import { Check, Pencil, X } from 'lucide-react';
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import EditorSkeleton from '@/components/ui/editor-skeleton';
import { Input } from '@/components/ui/input';
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

const PRIORITY_STYLES: Record<
  NotePriority,
  { badge: string; dot: string; label: string }
> = {
  [NOTE_PRIORITIES.LOW]: {
    badge: 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100',
    dot: 'bg-sky-400',
    label: 'Low',
  },
  [NOTE_PRIORITIES.MEDIUM]: {
    badge: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
    dot: 'bg-amber-400',
    label: 'Medium',
  },
  [NOTE_PRIORITIES.HIGH]: {
    badge: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100',
    dot: 'bg-rose-500',
    label: 'High',
  },
};

// Renders markdown-ish HTML from the rich text editor's HTML output
function RenderedContent({ html }: { html: string }) {
  if (!html || html === '<p></p>' || html.trim() === '') {
    return (
      <p className="text-sm text-muted-foreground italic">
        Click to add content…
      </p>
    );
  }
  return (
    <div
      className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed
        prose-headings:font-semibold prose-headings:tracking-tight
        prose-p:my-1 prose-li:my-0.5 prose-ul:my-1 prose-ol:my-1
        prose-strong:font-semibold prose-code:rounded prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:text-xs"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

type ActiveField = 'title' | 'priority' | 'content' | null;

const NoteFormSheet = ({
  isOpen,
  onOpenChange,
  selectedItem,
}: NoteFormSheetProps) => {
  const [formState, setFormState] = useState<Note>(defaultFormState);
  const [activeField, setActiveField] = useState<ActiveField>(null);
  const lastToastId = useRef<string | number | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && selectedItem) {
      setFormState(selectedItem);
    }
  }, [isOpen, selectedItem]);

  // Focus title input when it becomes active
  useEffect(() => {
    if (activeField === 'title') {
      setTimeout(() => titleInputRef.current?.focus(), 0);
    }
  }, [activeField]);

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
    toast.success('Note saved successfully');
    onOpenChange(false);
  };

  const closeField = useCallback(() => setActiveField(null), []);

  const isEditing = Boolean(formState.id);
  const priorityStyle =
    PRIORITY_STYLES[formState.priority] ?? PRIORITY_STYLES[NOTE_PRIORITIES.LOW];

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent
        className="sm:max-w-2xl flex flex-col gap-0 p-0 overflow-hidden"
        onCloseAutoFocus={() => {
          setFormState(defaultFormState);
          setActiveField(null);
        }}
      >
        {/* Top bar */}
        <div className="flex items-center gap-2 px-6 py-3 border-b bg-muted/40">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
            {isEditing ? 'Edit Note' : 'New Note'}
          </span>
        </div>

        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto"
        >
          {/* ── Title ── */}
          <div className="px-6 pt-6 pb-2">
            {activeField === 'title' ? (
              <div className="flex items-start gap-2">
                <Input
                  ref={titleInputRef}
                  id="title"
                  type="text"
                  placeholder="Note title…"
                  value={formState.title}
                  className="text-xl font-semibold h-auto py-1 px-2 border-0 border-b-2 border-primary rounded-none shadow-none focus-visible:ring-0 bg-transparent"
                  onChange={(e) =>
                    setFormState({ ...formState, title: e.target.value })
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') closeField();
                    if (e.key === 'Escape') closeField();
                  }}
                />
                <button
                  type="button"
                  onClick={closeField}
                  className="mt-1.5 shrink-0 rounded-full p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <Check className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setActiveField('title')}
                className={cn(
                  'group w-full text-left rounded-md px-2 py-1 -mx-2 transition-colors hover:bg-muted/60',
                  !formState.title && 'text-muted-foreground',
                )}
              >
                <span className="flex items-center gap-2">
                  <span
                    className={cn(
                      'text-xl font-semibold',
                      !formState.title && 'font-normal text-base italic',
                    )}
                  >
                    {formState.title || 'Click to add title…'}
                  </span>
                  <Pencil className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </span>
              </button>
            )}
          </div>

          {/* ── Metadata row ── */}
          <div className="px-6 py-3 border-b flex items-center gap-6">
            {/* Priority */}
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-xs font-medium text-muted-foreground w-14 shrink-0">
                Priority
              </span>
              {activeField === 'priority' ? (
                <div className="flex items-center gap-2">
                  <Select
                    value={formState.priority}
                    onValueChange={(v) => {
                      setFormState({
                        ...formState,
                        priority: v as NotePriority,
                      });
                      closeField();
                    }}
                    open
                    onOpenChange={(open) => {
                      if (!open) closeField();
                    }}
                  >
                    <SelectTrigger className="h-7 text-xs w-32">
                      <SelectValue placeholder="Priority" />
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
                  <button
                    type="button"
                    onClick={closeField}
                    className="rounded-full p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveField('priority')}
                  className={cn(
                    'group inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
                    priorityStyle.badge,
                  )}
                >
                  <span
                    className={cn(
                      'h-1.5 w-1.5 rounded-full shrink-0',
                      priorityStyle.dot,
                    )}
                  />
                  {priorityStyle.label}
                  <Pencil className="h-2.5 w-2.5 ml-0.5 opacity-0 group-hover:opacity-70 transition-opacity" />
                </button>
              )}
            </div>
          </div>

          {/* ── Content ── */}
          <div className="px-6 py-4">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest block mb-3">
              Content
            </span>
            {activeField === 'content' ? (
              <div className="flex flex-col gap-2">
                <Suspense fallback={<EditorSkeleton />}>
                  <RichTextEditor
                    content={formState.content}
                    onChange={(content) =>
                      setFormState({ ...formState, content })
                    }
                    onCmdEnter={() => formRef.current?.requestSubmit()}
                  />
                </Suspense>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={closeField}
                    className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setActiveField('content')}
                className="group w-full text-left rounded-md border border-transparent hover:border-border hover:bg-muted/40 px-3 py-2.5 -mx-3 transition-all min-h-[80px]"
              >
                <RenderedContent html={formState.content} />
              </button>
            )}
          </div>
        </form>

        {/* Footer */}
        <SheetFooter className="border-t px-6 py-4 gap-2">
          <Button
            type="button"
            className="w-full"
            disabled={!formState.title.trim()}
            onClick={() => handleSubmit()}
          >
            Save note
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
