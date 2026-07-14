import {
  AlertCircle,
  ChevronDown,
  FileText,
  MoreHorizontal,
  Plus,
  RotateCcw,
  Star,
  Trash2,
} from 'lucide-react';
import {
  type FormEvent,
  Fragment,
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  TemplateVariableEditor,
  type TemplateVariableEditorHandle,
} from '@/components/newtab/TemplateVariableEditor';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  addStrictReviewTemplate,
  DEFAULT_STRICT_REVIEW_TEMPLATE,
  removeStrictReviewTemplate,
  setDefaultStrictReviewTemplate,
  STRICT_REVIEW_TEMPLATE_VARIABLES,
  type StrictReviewTemplateVariableKey,
  updateStrictReviewTemplate,
  useStrictReviewTemplates,
} from '@/lib/storage/prompt-templates';
import { cn } from '@/lib/utils';
import { type StrictReviewTemplate } from '@/types/prompt-templates';

const PREVIEW_VARS: Record<StrictReviewTemplateVariableKey, string> = {
  source: 'feature/example',
  target: 'main',
  url: 'https://gitlab.example.com/group/project/-/merge_requests/123',
};

const KNOWN_VARIABLE_KEYS = new Set<string>(
  STRICT_REVIEW_TEMPLATE_VARIABLES.map((v) => v.key),
);

const renderPreviewTokens = (
  template: string,
  substitutions: Record<string, string>,
): ReactNode[] => {
  const nodes: ReactNode[] = [];
  const regex = /\{(\w+)\}/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(template)) !== null) {
    if (match.index > last) {
      nodes.push(
        <Fragment key={`t-${last}`}>
          {template.slice(last, match.index)}
        </Fragment>,
      );
    }
    const key = match[1];
    const known = KNOWN_VARIABLE_KEYS.has(key);
    const display = known ? substitutions[key] : match[0];
    nodes.push(
      <span
        key={`v-${match.index}`}
        className={
          known
            ? 'rounded-md bg-info text-info-foreground px-1.5 py-0.5 font-semibold'
            : 'rounded-md bg-destructive/20 text-destructive px-1.5 py-0.5 font-semibold'
        }
      >
        {display}
      </span>,
    );
    last = match.index + match[0].length;
  }
  if (last < template.length) {
    nodes.push(<Fragment key={`t-${last}`}>{template.slice(last)}</Fragment>);
  }
  return nodes;
};

interface Draft {
  name: string;
  urlPattern: string;
  template: string;
}

type PendingAction = 'add' | 'delete' | 'default' | 'save' | null;

interface Feedback {
  kind: 'error' | 'success';
  message: string;
}

export const StrictReviewTemplateDialog = ({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (nextOpen: boolean) => void;
}) => {
  const { templates, isLoading, loadError, reload } =
    useStrictReviewTemplates();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>({
    name: '',
    urlPattern: '',
    template: '',
  });
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [restoreUndo, setRestoreUndo] = useState<string | null>(null);
  const editorHandleRef = useRef<TemplateVariableEditorHandle>(null);

  const selected =
    templates.find((item) => item.id === selectedId) ??
    templates.find((item) => item.isDefault) ??
    templates[0];
  const resolvedId = selected?.id;

  // Load the resolved template into the draft when the selection changes, the
  // stored templates change, or the dialog reopens.
  useEffect(() => {
    const current = templates.find((item) => item.id === resolvedId);
    if (current) {
      setRestoreUndo(null);
      setDraft({
        name: current.name,
        urlPattern: current.urlPattern,
        template: current.template,
      });
    }
  }, [resolvedId, templates, open]);

  const previewTokens = useMemo(
    () => renderPreviewTokens(draft.template, PREVIEW_VARS),
    [draft.template],
  );

  const isDirty =
    selected != null &&
    (draft.name !== selected.name ||
      draft.urlPattern !== selected.urlPattern ||
      draft.template !== selected.template);
  const isBusy = pendingAction !== null;
  const isTemplateEmpty = draft.template.trim() === '';

  const confirmDiscardChanges = () =>
    !isDirty || window.confirm('Discard your unsaved template changes?');

  const updateDraft = (changes: Partial<Draft>) => {
    setFeedback(null);
    if (changes.template !== undefined) setRestoreUndo(null);
    setDraft((previous) => ({ ...previous, ...changes }));
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && isBusy) return;
    if (!nextOpen && !confirmDiscardChanges()) return;
    onOpenChange(nextOpen);
  };

  const handleSelect = (id: string) => {
    if (id === selected?.id || isBusy || !confirmDiscardChanges()) return false;
    setFeedback(null);
    setSelectedId(id);
    return true;
  };

  const handleTemplateKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    let nextIndex: number | null = null;
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      nextIndex = (index + 1) % templates.length;
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      nextIndex = (index - 1 + templates.length) % templates.length;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = templates.length - 1;
    }

    if (nextIndex === null) return;
    event.preventDefault();
    const nextTemplate = templates[nextIndex];
    if (!nextTemplate || !handleSelect(nextTemplate.id)) return;
    const radioButtons = event.currentTarget.parentElement?.querySelectorAll(
      'button[role="radio"]',
    );
    (radioButtons?.[nextIndex] as HTMLButtonElement | undefined)?.focus();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selected || isBusy || isTemplateEmpty) return;
    setPendingAction('save');
    setFeedback(null);
    try {
      await updateStrictReviewTemplate(selected.id, {
        ...selected,
        name: draft.name.trim() || 'Untitled',
        urlPattern: draft.urlPattern.trim(),
        template: draft.template,
      });
      setFeedback({ kind: 'success', message: 'Template saved.' });
    } catch {
      setFeedback({
        kind: 'error',
        message: 'Could not save the template. Your changes are still here.',
      });
    } finally {
      setPendingAction(null);
    }
  };

  const handleAdd = async () => {
    if (isBusy || !confirmDiscardChanges()) return;
    setPendingAction('add');
    setFeedback(null);
    const created: StrictReviewTemplate = {
      id: crypto.randomUUID(),
      name: 'New template',
      urlPattern: '',
      template: DEFAULT_STRICT_REVIEW_TEMPLATE,
      isDefault: false,
    };
    try {
      await addStrictReviewTemplate(created);
      setSelectedId(created.id);
    } catch {
      setFeedback({
        kind: 'error',
        message: 'Could not create a template. Try again.',
      });
    } finally {
      setPendingAction(null);
    }
  };

  const handleDelete = async () => {
    if (!selected || templates.length <= 1 || isBusy) return;
    if (!window.confirm("Delete this template? This can't be undone.")) return;

    setPendingAction('delete');
    setFeedback(null);
    try {
      await removeStrictReviewTemplate(selected.id);
      setSelectedId(null);
    } catch {
      setFeedback({
        kind: 'error',
        message: 'Could not delete the template. Try again.',
      });
    } finally {
      setPendingAction(null);
    }
  };

  const handleSetDefault = async () => {
    if (!selected || isBusy) return;
    setPendingAction('default');
    setFeedback(null);
    try {
      await setDefaultStrictReviewTemplate(selected.id);
      setFeedback({ kind: 'success', message: 'Default template updated.' });
    } catch {
      setFeedback({
        kind: 'error',
        message: 'Could not update the default template. Try again.',
      });
    } finally {
      setPendingAction(null);
    }
  };

  const handleRestoreInstructions = () => {
    setFeedback(null);
    const previousTemplate = draft.template;
    setDraft((previous) => ({
      ...previous,
      template: DEFAULT_STRICT_REVIEW_TEMPLATE,
    }));
    editorHandleRef.current?.setTemplateString(DEFAULT_STRICT_REVIEW_TEMPLATE);
    setRestoreUndo(previousTemplate);
  };

  const handleUndoRestore = () => {
    if (restoreUndo === null) return;
    const previousTemplate = restoreUndo;
    setRestoreUndo(null);
    setDraft((previous) => ({ ...previous, template: previousTemplate }));
    editorHandleRef.current?.setTemplateString(previousTemplate);
    editorHandleRef.current?.focus();
  };

  const unknownVariables = useMemo(() => {
    const matches = draft.template.matchAll(/\{(\w+)\}/g);
    return Array.from(
      new Set(
        Array.from(matches, (match) => match[1]).filter(
          (key) => !KNOWN_VARIABLE_KEYS.has(key),
        ),
      ),
    );
  }, [draft.template]);

  const editorDescriptionIds = [
    'strict-review-template-help',
    isTemplateEmpty ? 'strict-review-template-error' : null,
    unknownVariables.length > 0 ? 'strict-review-template-unknown' : null,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={!isBusy}
        className="flex max-h-[90vh] max-w-4xl flex-col overflow-hidden p-4 sm:max-w-4xl sm:p-6"
      >
        <DialogHeader>
          <DialogTitle>Strict Review Templates</DialogTitle>
          <DialogDescription>
            Define the instructions used when copying a strict review prompt.
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-4 sm:flex-row">
          <div className="flex w-full shrink-0 flex-col gap-2 border-b pb-3 sm:w-52 sm:border-r sm:border-b-0 sm:pr-3 sm:pb-0">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Templates</span>
              <div className="flex items-center gap-1">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      aria-label="Selected template actions"
                      disabled={!selected || isBusy}
                    >
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-64">
                    {selected && !selected.isDefault && (
                      <DropdownMenuItem
                        disabled={isDirty || isBusy}
                        onSelect={() => void handleSetDefault()}
                      >
                        <Star />
                        <span className="flex flex-col">
                          <span>Set as default</span>
                          {isDirty && (
                            <span className="text-xs text-muted-foreground">
                              Save changes first
                            </span>
                          )}
                        </span>
                      </DropdownMenuItem>
                    )}
                    {selected && !selected.isDefault && (
                      <DropdownMenuSeparator />
                    )}
                    <DropdownMenuItem
                      variant="destructive"
                      disabled={!selected || templates.length <= 1 || isBusy}
                      onSelect={() => void handleDelete()}
                    >
                      <Trash2 />
                      <span className="flex flex-col">
                        <span>Delete template</span>
                        {templates.length <= 1 && (
                          <span className="text-xs text-muted-foreground">
                            Keep at least one template
                          </span>
                        )}
                      </span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2"
                  onClick={handleAdd}
                  disabled={isLoading || loadError != null || isBusy}
                  loading={pendingAction === 'add'}
                >
                  <Plus className="size-3.5" />
                  Add
                </Button>
              </div>
            </div>
            <div
              className="flex min-h-0 flex-1 gap-1 overflow-x-auto sm:flex-col sm:overflow-x-visible sm:overflow-y-auto"
              role="radiogroup"
              aria-label="Strict review templates"
            >
              {isLoading && (
                <div className="flex w-52 flex-col gap-2 px-1 py-1 sm:w-full">
                  <Skeleton className="h-7 w-full" />
                  <Skeleton className="h-7 w-4/5" />
                </div>
              )}
              {!isLoading &&
                templates.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelect(item.id)}
                    role="radio"
                    aria-checked={item.id === selected?.id}
                    tabIndex={item.id === selected?.id ? 0 : -1}
                    onKeyDown={(event) => handleTemplateKeyDown(event, index)}
                    disabled={isBusy}
                    className={cn(
                      'flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-sm outline-none motion-safe:transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:w-full',
                      item.id === selected?.id
                        ? 'bg-secondary text-secondary-foreground'
                        : 'hover:bg-muted/50',
                    )}
                  >
                    {item.isDefault && (
                      <>
                        <Star className="size-3 shrink-0 fill-current text-primary" />
                        <span className="sr-only">Default: </span>
                      </>
                    )}
                    <span className="min-w-0 truncate">{item.name}</span>
                    {item.isDefault && (
                      <span className="ml-auto text-xs text-muted-foreground">
                        Default
                      </span>
                    )}
                  </button>
                ))}
            </div>
          </div>

          {isLoading ? (
            <div
              className="flex min-h-64 flex-1 flex-col gap-4"
              role="status"
              aria-label="Loading templates"
            >
              <div className="flex gap-3">
                <Skeleton className="h-16 flex-1" />
                <Skeleton className="h-16 flex-1" />
              </div>
              <Skeleton className="h-8 w-72 max-w-full" />
              <Skeleton className="h-52 w-full" />
            </div>
          ) : loadError ? (
            <div
              className="flex min-h-64 flex-1 flex-col items-center justify-center px-6 text-center"
              role="alert"
            >
              <AlertCircle className="mb-3 size-6 text-destructive" />
              <h3 className="text-sm font-semibold">Templates unavailable</h3>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Hustle Hub could not read your saved templates. Nothing was
                changed.
              </p>
              <Button
                type="button"
                variant="outline"
                className="mt-4"
                onClick={() => void reload()}
              >
                Try again
              </Button>
            </div>
          ) : !selected ? (
            <div className="flex min-h-64 flex-1 flex-col items-center justify-center px-6 text-center">
              <FileText className="mb-3 size-6 text-muted-foreground" />
              <h3 className="text-sm font-semibold">No templates yet</h3>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Create a template to define the instructions copied for strict
                review.
              </p>
              <Button
                type="button"
                className="mt-4"
                onClick={handleAdd}
                loading={pendingAction === 'add'}
              >
                <Plus className="size-4" />
                Create template
              </Button>
              {feedback?.kind === 'error' && (
                <p
                  className="mt-3 text-sm text-destructive"
                  role="alert"
                  aria-live="assertive"
                >
                  {feedback.message}
                </p>
              )}
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              aria-busy={isBusy}
              className="flex min-h-0 flex-1 flex-col gap-4"
            >
              <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto pr-1">
                <fieldset className="min-w-0 space-y-3">
                  <legend className="text-sm font-semibold">Identity</legend>
                  <div className="space-y-2">
                    <Label htmlFor="template-name">Name</Label>
                    <Input
                      id="template-name"
                      value={draft.name}
                      onChange={(event) =>
                        updateDraft({ name: event.target.value })
                      }
                      placeholder="e.g. Mobile app"
                      maxLength={100}
                      disabled={isBusy}
                      autoFocus
                    />
                  </div>
                </fieldset>

                <fieldset className="min-w-0 space-y-3 border-t pt-4">
                  <legend className="text-sm font-semibold">When to use</legend>
                  <div className="space-y-2">
                    <Label htmlFor="template-url-pattern">URL pattern</Label>
                    <textarea
                      id="template-url-pattern"
                      value={draft.urlPattern}
                      onChange={(event) =>
                        updateDraft({ urlPattern: event.target.value })
                      }
                      placeholder="e.g. group/project, !group/legacy"
                      maxLength={1000}
                      disabled={isBusy}
                      rows={3}
                      aria-describedby="template-url-pattern-help"
                      className="flex w-full resize-y rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/20"
                    />
                    <p
                      id="template-url-pattern-help"
                      className="max-w-[70ch] text-xs text-muted-foreground"
                    >
                      Match the MR project path. Separate terms with commas or
                      new lines. Use <code>*</code> as a wildcard and{' '}
                      <code>!</code> to exclude a term. Leave empty to use only
                      as the fallback default.
                    </p>
                  </div>
                </fieldset>

                <fieldset className="min-w-0 space-y-3 border-t pt-4">
                  <legend className="text-sm font-semibold">
                    Review instructions
                  </legend>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div
                      className="flex flex-wrap gap-1.5"
                      role="group"
                      aria-label="Insert a variable"
                    >
                      {STRICT_REVIEW_TEMPLATE_VARIABLES.map((variable) => (
                        <Tooltip key={variable.key}>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              disabled={isBusy}
                              onClick={() =>
                                editorHandleRef.current?.insertVariable(
                                  variable.key,
                                )
                              }
                              className="h-8 font-mono text-xs"
                              aria-label={`Insert ${variable.label} variable`}
                            >
                              {`{${variable.key}}`}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-64">
                            {variable.description}
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                    <div className="flex items-center gap-1">
                      {restoreUndo !== null && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleUndoRestore}
                          disabled={isBusy}
                        >
                          Undo restore
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRestoreInstructions}
                        disabled={
                          isBusy ||
                          draft.template === DEFAULT_STRICT_REVIEW_TEMPLATE
                        }
                      >
                        <RotateCcw className="size-3.5" />
                        Restore default instructions
                      </Button>
                    </div>
                  </div>
                  <p
                    id="strict-review-template-help"
                    className="text-xs text-muted-foreground"
                  >
                    Insert a variable with the toolbar or type <code>/</code> in
                    the editor.
                  </p>
                  <TemplateVariableEditor
                    id="strict-review-template-editor"
                    ariaLabel="Strict review template"
                    value={draft.template}
                    onChange={(next) => updateDraft({ template: next })}
                    variables={STRICT_REVIEW_TEMPLATE_VARIABLES}
                    handleRef={editorHandleRef}
                    ariaDescribedBy={editorDescriptionIds}
                    ariaInvalid={isTemplateEmpty}
                    disabled={isBusy}
                  />
                  {isTemplateEmpty && (
                    <p
                      id="strict-review-template-error"
                      className="text-xs text-destructive"
                    >
                      Add review instructions before saving.
                    </p>
                  )}
                  {unknownVariables.length > 0 && (
                    <p
                      id="strict-review-template-unknown"
                      className="text-xs text-warning"
                      role="status"
                      aria-live="polite"
                    >
                      Unknown{' '}
                      {unknownVariables.length === 1 ? 'variable' : 'variables'}
                      : {unknownVariables.map((key) => `{${key}}`).join(', ')}.
                      Unknown variables remain unchanged when copied.
                    </p>
                  )}

                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="group px-2"
                      >
                        Example preview
                        <span className="text-xs font-normal text-muted-foreground">
                          Sample values
                        </span>
                        <ChevronDown className="size-3.5 transition-transform group-data-[state=open]:rotate-180 motion-reduce:transition-none" />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-2">
                      <div className="max-h-40 overflow-auto rounded-md bg-muted/40 p-3 text-xs whitespace-pre-wrap break-words font-mono leading-snug">
                        {previewTokens.length > 0 ? (
                          previewTokens
                        ) : (
                          <span className="font-sans text-muted-foreground">
                            Your rendered template will appear here using sample
                            values.
                          </span>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </fieldset>
              </div>

              <div className="border-t pt-3">
                {feedback && (
                  <p
                    className={cn(
                      'mb-2 text-xs',
                      feedback.kind === 'error'
                        ? 'text-destructive'
                        : 'text-success',
                    )}
                    role={feedback.kind === 'error' ? 'alert' : 'status'}
                    aria-live={
                      feedback.kind === 'error' ? 'assertive' : 'polite'
                    }
                  >
                    {feedback.message}
                  </p>
                )}
                <DialogFooter className="flex-row items-center justify-between gap-2 sm:justify-between">
                  {isDirty && (
                    <span
                      className="min-w-0 truncate text-xs text-muted-foreground"
                      role="status"
                    >
                      Unsaved changes
                    </span>
                  )}
                  <div className="ml-auto flex shrink-0 gap-2">
                    <DialogClose asChild>
                      <Button type="button" variant="outline" disabled={isBusy}>
                        Close
                      </Button>
                    </DialogClose>
                    <Button
                      type="submit"
                      disabled={!isDirty || isTemplateEmpty || isBusy}
                      loading={pendingAction === 'save'}
                    >
                      Save
                    </Button>
                  </div>
                </DialogFooter>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
