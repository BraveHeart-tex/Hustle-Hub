import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  ArchiveIcon,
  MoreHorizontalIcon,
  NotebookTextIcon,
  PencilIcon,
  PinIcon,
  Trash2Icon,
  XIcon,
} from 'lucide-react';
import {
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { removeNote, updateNote } from '@/lib/storage/notes';
import { cn } from '@/lib/utils';
import { type Note, type NoteTask } from '@/types/notes';

import { useNotesPage } from './useNotesPage';

const priorityConfig: Record<Note['priority'], { label: string; dot: string }> =
  {
    high: { label: 'High', dot: 'bg-red-500' },
    medium: { label: 'Medium', dot: 'bg-yellow-500' },
    low: { label: 'Low', dot: 'bg-blue-500' },
  };

const formatRelativeTime = (value?: string) => {
  if (!value) {
    return 'No date';
  }

  const date = new Date(value);
  const diffSeconds = Math.max(
    0,
    Math.floor((Date.now() - date.getTime()) / 1000),
  );

  if (Number.isNaN(date.getTime())) {
    return 'No date';
  }

  if (diffSeconds < 60) {
    return 'just now';
  }

  const intervals = [
    { unit: 'year', seconds: 31536000 },
    { unit: 'month', seconds: 2592000 },
    { unit: 'week', seconds: 604800 },
    { unit: 'day', seconds: 86400 },
    { unit: 'hour', seconds: 3600 },
    { unit: 'minute', seconds: 60 },
  ];

  const interval = intervals.find((item) => diffSeconds >= item.seconds);
  if (!interval) {
    return 'just now';
  }

  const count = Math.floor(diffSeconds / interval.seconds);
  return `${count} ${interval.unit}${count === 1 ? '' : 's'} ago`;
};

const formatDate = (value?: string) => {
  if (!value) {
    return 'No date';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'No date';
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

const extractBulletItems = (content: string) => {
  if (!content.trim() || typeof DOMParser === 'undefined') {
    return [];
  }

  const doc = new DOMParser().parseFromString(content, 'text/html');
  return Array.from(doc.querySelectorAll('li'))
    .map((item) => item.textContent?.trim() ?? '')
    .filter(Boolean);
};

interface SectionProps {
  title: string;
  children: ReactNode;
}

const DetailSection = ({ title, children }: SectionProps) => (
  <section className="space-y-3">
    <h2 className="mb-3 border-b border-border pb-2 text-base font-semibold text-foreground">
      {title}
    </h2>
    {children}
  </section>
);

interface SelectedNoteDetailProps {
  note: Note;
}

const SelectedNoteDetail = ({ note }: SelectedNoteDetailProps) => {
  const { setSelectedNoteId } = useNotesPage();
  const [title, setTitle] = useState(note.title);
  const [newTag, setNewTag] = useState('');
  const [newTask, setNewTask] = useState('');
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bulletItems = useMemo(
    () => extractBulletItems(note.content),
    [note.content],
  );

  const editor = useEditor({
    extensions: [StarterKit],
    content: note.content,
    onUpdate: ({ editor }) => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }

      saveTimerRef.current = setTimeout(() => {
        void updateNote(note.id, {
          content: editor.getHTML(),
          updatedAt: new Date().toISOString(),
        });
      }, 500);
    },
    editorProps: {
      attributes: {
        'data-placeholder': 'Write context for this note...',
        class:
          'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[120px]',
      },
    },
  });

  useEffect(() => {
    setTitle(note.title);
  }, [note.id, note.title]);

  useEffect(() => {
    const isFreshNote =
      note.title === 'Untitled' &&
      !note.content &&
      !note.tags?.length &&
      !note.tasks?.length;

    if (!isFreshNote) {
      return;
    }

    window.setTimeout(() => {
      titleRef.current?.focus();
      titleRef.current?.select();
    }, 0);
  }, [
    note.content,
    note.id,
    note.tags?.length,
    note.tasks?.length,
    note.title,
  ]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  const saveNote = (changes: Partial<Note>) =>
    updateNote(note.id, {
      ...changes,
      updatedAt: new Date().toISOString(),
    });

  const saveTitle = () => {
    const cleanTitle = title.trim() || 'Untitled';
    setTitle(cleanTitle);

    if (cleanTitle === note.title) {
      return;
    }

    void saveNote({ title: cleanTitle });
  };

  const addTag = () => {
    const cleanTag = newTag.trim();
    if (!cleanTag || note.tags?.includes(cleanTag)) {
      setNewTag('');
      return;
    }

    void saveNote({ tags: [...(note.tags ?? []), cleanTag] });
    setNewTag('');
  };

  const removeTag = (tag: string) => {
    void saveNote({ tags: (note.tags ?? []).filter((item) => item !== tag) });
  };

  const updateTasks = (tasks: NoteTask[]) => {
    void saveNote({ tasks });
  };

  const addTask = () => {
    const cleanTask = newTask.trim();
    if (!cleanTask) {
      return;
    }

    updateTasks([
      ...(note.tasks ?? []),
      {
        id: crypto.randomUUID(),
        label: cleanTask,
        completed: false,
      },
    ]);
    setNewTask('');
  };

  const handleDelete = async () => {
    await removeNote(note.id);
    setSelectedNoteId(null);
    setIsDeleteOpen(false);
  };

  return (
    <article className="min-h-full bg-card">
      <div className="sticky top-0 z-10 flex items-center justify-end gap-1 border-b border-border bg-card/95 px-6 py-3 backdrop-blur">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => void saveNote({ pinned: !note.pinned })}
          className={cn(note.pinned && 'text-yellow-500')}
        >
          <PinIcon
            className={cn('h-4 w-4', note.pinned && 'fill-yellow-500')}
          />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => titleRef.current?.focus()}
        >
          <PencilIcon className="h-4 w-4" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontalIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => void saveNote({ archived: !note.archived })}
            >
              <ArchiveIcon className="h-4 w-4" />
              {note.archived ? 'Unarchive' : 'Archive'}
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onClick={() => setIsDeleteOpen(true)}
            >
              <Trash2Icon className="h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mx-auto flex max-w-4xl flex-col gap-8 px-8 py-8">
        <textarea
          ref={titleRef}
          value={title}
          rows={1}
          onBlur={saveTitle}
          onChange={(event) => {
            setTitle(event.target.value);
            event.target.style.height = 'auto';
            event.target.style.height = `${event.target.scrollHeight}px`;
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              saveTitle();
              editor?.commands.focus();
            }
          }}
          className="min-h-12 w-full resize-none overflow-hidden border-0 bg-transparent p-0 text-3xl font-semibold leading-tight text-foreground outline-none placeholder:text-muted-foreground"
          placeholder="Untitled"
        />

        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2 rounded-md px-1 py-0.5 transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <span
                  className={cn(
                    'h-2.5 w-2.5 rounded-full',
                    priorityConfig[note.priority].dot,
                  )}
                />
                {priorityConfig[note.priority].label}
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-40 p-1">
              {(Object.keys(priorityConfig) as Note['priority'][]).map(
                (priority) => (
                  <button
                    key={priority}
                    type="button"
                    onClick={() => void saveNote({ priority })}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                  >
                    <span
                      className={cn(
                        'h-2.5 w-2.5 rounded-full',
                        priorityConfig[priority].dot,
                      )}
                    />
                    {priorityConfig[priority].label}
                  </button>
                ),
              )}
            </PopoverContent>
          </Popover>

          <div className="flex flex-wrap items-center gap-1.5">
            {(note.tags ?? []).map((tag) => (
              <Badge key={tag} variant="secondary" className="gap-1">
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="rounded-sm text-muted-foreground hover:text-foreground"
                >
                  <XIcon className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            <Input
              value={newTag}
              onChange={(event) => setNewTag(event.target.value)}
              onBlur={addTag}
              onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  addTag();
                }
              }}
              placeholder="+ tag"
              className="h-7 w-24 border-0 bg-transparent px-1 text-xs shadow-none focus-visible:ring-0"
            />
          </div>

          <span>·</span>
          <span>
            Updated {formatRelativeTime(note.updatedAt ?? note.createdAt)}
          </span>
        </div>

        <DetailSection title="Context">
          <div
            key={note.id}
            className="rounded-lg border border-border bg-background p-4"
          >
            <EditorContent editor={editor} />
          </div>
        </DetailSection>

        <DetailSection title="Tasks">
          <div className="space-y-2">
            {(note.tasks ?? []).map((task) => (
              <div key={task.id} className="flex items-center gap-3">
                <Checkbox
                  checked={task.completed}
                  onCheckedChange={(checked) =>
                    updateTasks(
                      (note.tasks ?? []).map((item) =>
                        item.id === task.id
                          ? { ...item, completed: checked === true }
                          : item,
                      ),
                    )
                  }
                />
                <Input
                  value={task.label}
                  onChange={(event) =>
                    updateTasks(
                      (note.tasks ?? []).map((item) =>
                        item.id === task.id
                          ? { ...item, label: event.target.value }
                          : item,
                      ),
                    )
                  }
                  className={cn(
                    'h-8 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0',
                    task.completed && 'text-muted-foreground line-through',
                  )}
                />
              </div>
            ))}

            <Input
              value={newTask}
              onChange={(event) => setNewTask(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  addTask();
                }
              }}
              placeholder="+ Add task"
              className="h-9 border-dashed bg-transparent"
            />
          </div>
        </DetailSection>

        <DetailSection title="Notes">
          {bulletItems.length > 0 ? (
            <ul className="list-disc space-y-1 pl-5 text-sm text-foreground">
              {bulletItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              No bullet notes found in the editor content.
            </p>
          )}
        </DetailSection>

        <div className="flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
          <span>Created {formatDate(note.createdAt)}</span>
          <span>
            Last updated {formatDate(note.updatedAt ?? note.createdAt)}
          </span>
        </div>
      </div>

      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete note?</DialogTitle>
            <DialogDescription>
              This permanently removes the note and its tasks.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </article>
  );
};

const NoteDetail = () => {
  const { selectedNote } = useNotesPage();

  if (!selectedNote) {
    return (
      <section className="flex min-w-0 flex-1 items-center justify-center bg-card">
        <div className="flex flex-col items-center gap-3 text-center text-muted-foreground">
          <NotebookTextIcon className="h-14 w-14" />
          <p className="text-lg font-medium text-foreground">Select a note</p>
        </div>
      </section>
    );
  }

  return (
    <section className="min-w-0 flex-1 overflow-y-auto">
      <SelectedNoteDetail key={selectedNote.id} note={selectedNote} />
    </section>
  );
};

export default NoteDetail;
