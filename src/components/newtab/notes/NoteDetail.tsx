import { EditorContent, useEditor } from '@tiptap/react';
import {
  ArchiveIcon,
  ExternalLinkIcon,
  MoreHorizontalIcon,
  NotebookTextIcon,
  PencilIcon,
  PinIcon,
  Trash2Icon,
  XIcon,
} from 'lucide-react';
import {
  type KeyboardEvent,
  type MouseEvent,
  useEffect,
  useRef,
  useState,
} from 'react';

import GitlabIcon from '@/components/misc/GitlabIcon';
import JiraIcon from '@/components/misc/JiraIcon';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { type Note, type NoteLinkedWorkItem } from '@/types/notes';

import { createEditorExtensions } from './editor/editorExtensions';
import FloatingToolbar from './editor/FloatingToolbar';
import NoteWorkItemPicker from './NoteWorkItemPicker';
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

const isSameLinkedItem = (
  left: NoteLinkedWorkItem,
  right: NoteLinkedWorkItem,
) => left.type === right.type && left.id === right.id;

const linkedItemLabel = (item: NoteLinkedWorkItem) => item.key ?? item.id;

interface SelectedNoteDetailProps {
  note: Note;
}

const SelectedNoteDetail = ({ note }: SelectedNoteDetailProps) => {
  const { setSelectedNoteId } = useNotesPage();
  const [title, setTitle] = useState(note.title);
  const [newTag, setNewTag] = useState('');
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isWorkItemPickerOpen, setIsWorkItemPickerOpen] = useState(false);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const editor = useEditor({
    extensions: createEditorExtensions({
      onWorkItemLink: () => setIsWorkItemPickerOpen(true),
    }),
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
        class: 'tiptap not-prose min-h-[300px] focus:outline-none',
      },
    },
  });

  useEffect(() => {
    setTitle(note.title);
  }, [note.id, note.title]);

  useEffect(() => {
    const isFreshNote =
      note.title === 'Untitled' && !note.content && !note.tags?.length;

    if (!isFreshNote) {
      return;
    }

    window.setTimeout(() => {
      titleRef.current?.focus();
      titleRef.current?.select();
    }, 0);
  }, [note.content, note.id, note.tags?.length, note.title]);

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

  const linkWorkItem = (item: NoteLinkedWorkItem) => {
    const linkedItems = note.linkedItems ?? [];
    if (linkedItems.some((linkedItem) => isSameLinkedItem(linkedItem, item))) {
      return;
    }

    void saveNote({ linkedItems: [...linkedItems, item] });
  };

  const removeLinkedItem = (
    item: NoteLinkedWorkItem,
    event: MouseEvent<HTMLButtonElement>,
  ) => {
    event.stopPropagation();
    void saveNote({
      linkedItems: (note.linkedItems ?? []).filter(
        (linkedItem) => !isSameLinkedItem(linkedItem, item),
      ),
    });
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

          {!!note.linkedItems?.length && (
            <>
              <span>·</span>
              <div className="flex flex-wrap items-center gap-1.5">
                {note.linkedItems.map((item) => {
                  const Icon = item.type === 'jira' ? JiraIcon : GitlabIcon;

                  return (
                    <Badge
                      key={`${item.type}-${item.id}`}
                      variant="secondary"
                      className="max-w-60 gap-1"
                      title={item.title}
                    >
                      <Icon
                        className={cn(
                          'h-3 w-3 shrink-0',
                          item.type === 'jira' && 'text-blue-500',
                        )}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          window.open(item.url, '_blank', 'noopener,noreferrer')
                        }
                        className="flex min-w-0 items-center gap-1 rounded-sm hover:text-foreground"
                      >
                        <span className="shrink-0 font-mono">
                          {linkedItemLabel(item)}
                        </span>
                        <span className="truncate">{item.title}</span>
                        <ExternalLinkIcon className="h-3 w-3 shrink-0 text-muted-foreground" />
                      </button>
                      <button
                        type="button"
                        onClick={(event) => removeLinkedItem(item, event)}
                        className="rounded-sm text-muted-foreground hover:text-foreground"
                      >
                        <XIcon className="h-3 w-3" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            </>
          )}

          <span>·</span>
          <span>
            Updated {formatRelativeTime(note.updatedAt ?? note.createdAt)}
          </span>
        </div>

        <div className="min-h-[300px]">
          <FloatingToolbar editor={editor} />
          <EditorContent editor={editor} />
        </div>

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
              This permanently removes the note.
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
      <NoteWorkItemPicker
        open={isWorkItemPickerOpen}
        linkedItems={note.linkedItems ?? []}
        onOpenChange={setIsWorkItemPickerOpen}
        onSelect={linkWorkItem}
      />
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
