import {
  AlertCircle,
  FileText,
  Plus,
  RotateCcw,
  Star,
  Trash2,
} from 'lucide-react';
import {
  type FormEvent,
  Fragment,
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
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
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
    setDraft((previous) => ({ ...previous, ...changes }));
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && isBusy) return;
    if (!nextOpen && !confirmDiscardChanges()) return;
    onOpenChange(nextOpen);
  };

  const handleSelect = (id: string) => {
    if (id === selected?.id || isBusy || !confirmDiscardChanges()) return;
    setFeedback(null);
    setSelectedId(id);
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

  const handleResetBody = () => {
    updateDraft({ template: DEFAULT_STRICT_REVIEW_TEMPLATE });
    editorHandleRef.current?.setTemplateString(DEFAULT_STRICT_REVIEW_TEMPLATE);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={!isBusy}
        className="flex max-h-[90vh] max-w-4xl flex-col overflow-hidden p-4 sm:max-w-4xl sm:p-6"
      >
        <DialogHeader>
          <DialogTitle>Strict Review Templates</DialogTitle>
          <DialogDescription>
            Keep one template per project. The copy shortcut auto-picks the
            template whose URL pattern matches the MR, falling back to the
            default. Type{' '}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">/</code> to
            insert a variable, or click a chip.
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-4 sm:flex-row">
          <div className="flex w-full shrink-0 flex-col gap-2 border-b pb-3 sm:w-52 sm:border-r sm:border-b-0 sm:pr-3 sm:pb-0">
            <div className="flex items-center justify-between">
              <Label>Templates</Label>
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
            <div className="flex min-h-0 flex-1 gap-1 overflow-x-auto sm:flex-col sm:overflow-x-visible sm:overflow-y-auto">
              {isLoading && (
                <div className="flex w-52 flex-col gap-2 px-1 py-1 sm:w-full">
                  <Skeleton className="h-7 w-full" />
                  <Skeleton className="h-7 w-4/5" />
                </div>
              )}
              {!isLoading &&
                templates.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelect(item.id)}
                    aria-pressed={item.id === selected?.id}
                    disabled={isBusy}
                    title={item.name}
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
              <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1">
                <div className="flex flex-col gap-3 md:flex-row">
                  <div className="flex-1 space-y-2">
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
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="template-url-pattern">URL pattern</Label>
                    <Input
                      id="template-url-pattern"
                      value={draft.urlPattern}
                      onChange={(event) =>
                        updateDraft({ urlPattern: event.target.value })
                      }
                      placeholder="e.g. group/project, !group/legacy"
                      maxLength={1000}
                      disabled={isBusy}
                    />
                    <p className="text-xs text-muted-foreground">
                      Matched against the MR project path. Comma or new-line
                      separated terms; <code>*</code> is a wildcard, and{' '}
                      <code>!</code> or <code>NOT</code> negates a term. Leave
                      empty to never auto-select.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Insert variable</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {STRICT_REVIEW_TEMPLATE_VARIABLES.map((variable) => (
                      <Button
                        key={variable.key}
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={isBusy}
                        onClick={() =>
                          editorHandleRef.current?.insertVariable(variable.key)
                        }
                        className="h-8 font-mono text-xs"
                        aria-label={`Insert ${variable.label} variable`}
                        title={variable.description}
                      >
                        {`{${variable.key}}`}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 px-1">
                  <Label htmlFor="strict-review-template-editor">
                    Template
                  </Label>
                  <TemplateVariableEditor
                    id="strict-review-template-editor"
                    ariaLabel="Strict review template"
                    value={draft.template}
                    onChange={(next) => updateDraft({ template: next })}
                    variables={STRICT_REVIEW_TEMPLATE_VARIABLES}
                    handleRef={editorHandleRef}
                    ariaDescribedBy={
                      isTemplateEmpty
                        ? 'strict-review-template-error'
                        : undefined
                    }
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
                </div>

                <div className="space-y-2 px-1">
                  <Label>Preview</Label>
                  <div className="max-h-40 overflow-auto rounded-md border bg-muted/30 p-3 text-xs whitespace-pre-wrap break-words font-mono leading-snug">
                    {previewTokens.length > 0 ? (
                      previewTokens
                    ) : (
                      <span className="font-sans text-muted-foreground">
                        Your rendered template will appear here.
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-2 border-t pt-4 sm:justify-between">
                <div className="flex flex-wrap gap-2">
                  {selected && !selected.isDefault && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleSetDefault}
                      disabled={isBusy || isDirty}
                      loading={pendingAction === 'default'}
                      title={
                        isDirty
                          ? 'Save or discard your changes before changing the default.'
                          : undefined
                      }
                    >
                      <Star className="size-3.5" />
                      Set as default
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleResetBody}
                    disabled={isBusy}
                  >
                    <RotateCcw className="size-3.5" />
                    Reset body
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleDelete}
                    disabled={isBusy || templates.length <= 1}
                    loading={pendingAction === 'delete'}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                    Delete
                  </Button>
                </div>
                <div className="flex min-w-0 flex-col gap-2 sm:items-end">
                  <div
                    className={cn(
                      'min-h-5 text-xs',
                      feedback?.kind === 'error'
                        ? 'text-destructive'
                        : 'text-success',
                    )}
                    role={feedback?.kind === 'error' ? 'alert' : 'status'}
                    aria-live={
                      feedback?.kind === 'error' ? 'assertive' : 'polite'
                    }
                  >
                    {feedback?.message}
                  </div>
                  <div className="flex gap-2">
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
                </div>
              </DialogFooter>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
