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
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

import { GitlabIcon } from '@/components/misc/GitlabIcon';
import { JiraIcon } from '@/components/misc/JiraIcon';
import { createNoteEditorExtensions } from '@/components/newtab/notes/editor/editorExtensions';
import { FloatingToolbar } from '@/components/newtab/notes/editor/FloatingToolbar';
import { NoteWorkItemPicker } from '@/components/newtab/notes/NoteWorkItemPicker';
import { useNotesPage } from '@/components/newtab/notes/useNotesPage';
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

const priorityConfig: Record<Note['priority'], { label: string; dot: string }> =
  {
    high: { label: 'High', dot: 'bg-destructive' },
    medium: { label: 'Medium', dot: 'bg-warning' },
    low: { label: 'Low', dot: 'bg-info' },
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

const isSameLinkedItem = (
  left: NoteLinkedWorkItem,
  right: NoteLinkedWorkItem,
) => left.type === right.type && left.id === right.id;

const linkedItemLabel = (item: NoteLinkedWorkItem) => item.key ?? item.id;

const autosizeTitle = (element: HTMLTextAreaElement | null) => {
  if (!element) {
    return;
  }

  element.style.height = 'auto';
  element.style.height = `${element.scrollHeight}px`;
};

interface SelectedNoteDetailProps {
  note: Note;
}

const SelectedNoteDetail = ({ note }: SelectedNoteDetailProps) => {
  const { setSelectedNoteId } = useNotesPage();
  const [title, setTitle] = useState(note.title);
  const [newTag, setNewTag] = useState('');
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isWorkItemPickerOpen, setIsWorkItemPickerOpen] = useState(false);
  const [editorSaveStatus, setEditorSaveStatus] = useState<
    'idle' | 'saving' | 'saved' | 'error'
  >('idle');
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const editor = useEditor({
    extensions: createNoteEditorExtensions({
      onWorkItemLink: () => setIsWorkItemPickerOpen(true),
    }),
    content: note.content,
    onUpdate: ({ editor }) => {
      setEditorSaveStatus('saving');

      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }

      saveTimerRef.current = setTimeout(async () => {
        try {
          await updateNote(note.id, {
            content: editor.getHTML(),
            updatedAt: new Date().toISOString(),
          });
          setEditorSaveStatus('saved');
        } catch {
          setEditorSaveStatus('error');
        }
      }, 500);
    },
    editorProps: {
      attributes: {
        'aria-label': 'Note content',
        class: 'notes-canvas tiptap flex-1',
      },
    },
  });

  useEffect(() => {
    setTitle(note.title);
  }, [note.id, note.title]);

  useLayoutEffect(() => {
    autosizeTitle(titleRef.current);
  }, [note.id, title]);

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
    <article className="flex min-h-full flex-col bg-card">
      <div className="sticky top-0 z-10 flex items-center justify-end gap-1 border-b border-border bg-card/95 px-3 py-3 backdrop-blur sm:px-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => void saveNote({ pinned: !note.pinned })}
          className={cn(note.pinned && 'text-primary')}
          aria-label={note.pinned ? 'Unpin note' : 'Pin note'}
          aria-pressed={note.pinned}
        >
          <PinIcon className={cn('h-4 w-4', note.pinned && 'fill-primary')} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => titleRef.current?.focus()}
          aria-label="Edit note title"
        >
          <PencilIcon className="h-4 w-4" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Note actions">
              <MoreHorizontalIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            alignOffset={8}
            sideOffset={6}
            className="min-w-28 border-0 shadow-floating"
          >
            <DropdownMenuItem
              onClick={() => void saveNote({ archived: !note.archived })}
              className="h-8 gap-1.5 px-2 py-0 text-sm"
            >
              <ArchiveIcon className="h-3.5 w-3.5" />
              {note.archived ? 'Unarchive' : 'Archive'}
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onClick={() => setIsDeleteOpen(true)}
              className="h-8 gap-1.5 px-2 py-0 text-sm"
            >
              <Trash2Icon className="h-3.5 w-3.5" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-6 sm:px-8 sm:py-8">
        <textarea
          ref={titleRef}
          value={title}
          rows={1}
          onBlur={saveTitle}
          onChange={(event) => {
            setTitle(event.target.value);
            autosizeTitle(event.target);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              saveTitle();
              editor?.commands.focus();
            }
          }}
          className="min-h-10 w-full resize-none appearance-none overflow-hidden border-0 bg-transparent p-0 text-2xl font-semibold leading-tight tracking-tight text-foreground shadow-none outline-none placeholder:text-muted-foreground focus:outline-none focus-visible:ring-0"
          placeholder="Untitled"
          aria-label="Note title"
        />

        <div className="mt-2 flex flex-col items-start justify-between gap-2 text-xs text-muted-foreground sm:flex-row sm:gap-4">
          <div className="flex min-w-0 flex-wrap items-center gap-1">
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="flex h-6 items-center gap-1.5 rounded-md px-1.5 font-medium outline-none transition-colors motion-reduce:transition-none hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                >
                  <span
                    className={cn(
                      'h-2 w-2 rounded-full',
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
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none hover:bg-accent focus-visible:ring-ring/50 focus-visible:ring-[3px]"
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

            <div className="flex flex-wrap items-center gap-0.5">
              {(note.tags ?? []).map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="h-6 gap-0.5 border-0 bg-transparent px-1.5 font-normal text-muted-foreground"
                >
                  {tag}
                  <button
                    type="button"
                    aria-label={`Remove ${tag} tag`}
                    onClick={() => removeTag(tag)}
                    className="rounded-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-ring/50 focus-visible:ring-[3px]"
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
                className="h-6 w-20 border-0 bg-transparent px-1.5 text-xs shadow-none"
              />
            </div>

            {!!note.linkedItems?.length && (
              <>
                <span aria-hidden="true" className="px-1">
                  ·
                </span>
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
                            window.open(
                              item.url,
                              '_blank',
                              'noopener,noreferrer',
                            )
                          }
                          className="flex min-w-0 items-center gap-1 rounded-sm outline-none hover:text-foreground focus-visible:ring-ring/50 focus-visible:ring-[3px]"
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
                          className="rounded-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                        >
                          <XIcon className="h-3 w-3" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          <span
            role="status"
            aria-live="polite"
            className={cn(
              'mt-1 shrink-0 whitespace-nowrap text-xs leading-4 text-muted-foreground',
              editorSaveStatus === 'error' && 'text-destructive',
            )}
          >
            {editorSaveStatus === 'saving' && 'Saving…'}
            {editorSaveStatus === 'saved' && 'Saved'}
            {editorSaveStatus === 'error' && 'Could not save'}
            {editorSaveStatus === 'idle' &&
              `Updated ${formatRelativeTime(note.updatedAt ?? note.createdAt)}`}
          </span>
        </div>

        <div className="-mx-3 mt-6 flex flex-1 flex-col rounded-lg border border-transparent px-3 py-3 transition-[border-color,box-shadow] duration-150 ease-out motion-reduce:transition-none focus-within:border-ring/40 focus-within:ring-[3px] focus-within:ring-ring/15">
          <FloatingToolbar editor={editor} />
          <EditorContent editor={editor} className="flex flex-1 flex-col" />
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
      {isWorkItemPickerOpen && (
        <NoteWorkItemPicker
          open={isWorkItemPickerOpen}
          linkedItems={note.linkedItems ?? []}
          onOpenChange={setIsWorkItemPickerOpen}
          onSelect={linkWorkItem}
        />
      )}
    </article>
  );
};

export const NoteDetail = () => {
  const { selectedNote } = useNotesPage();

  if (!selectedNote) {
    return (
      <section className="flex min-w-0 flex-1 items-center justify-center bg-card">
        <div className="flex flex-col items-center gap-1.5 text-center">
          <NotebookTextIcon className="size-6 text-muted-foreground/40" />
          <p className="text-base font-light text-muted-foreground">
            Select a note
          </p>
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
