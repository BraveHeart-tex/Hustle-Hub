import { Loader2, Plus, RotateCcw, Star, Trash2 } from 'lucide-react';
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

export const StrictReviewTemplateDialog = ({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (nextOpen: boolean) => void;
}) => {
  const { templates } = useStrictReviewTemplates();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>({
    name: '',
    urlPattern: '',
    template: '',
  });
  const [isSaving, setIsSaving] = useState(false);
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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selected) return;
    setIsSaving(true);
    try {
      await updateStrictReviewTemplate(selected.id, {
        ...selected,
        name: draft.name.trim() || 'Untitled',
        urlPattern: draft.urlPattern.trim(),
        template: draft.template,
      });
    } catch {
      window.alert('Failed to save template');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAdd = async () => {
    const created: StrictReviewTemplate = {
      id: crypto.randomUUID(),
      name: 'New template',
      urlPattern: '',
      template: DEFAULT_STRICT_REVIEW_TEMPLATE,
      isDefault: false,
    };
    await addStrictReviewTemplate(created);
    setSelectedId(created.id);
  };

  const handleDelete = async () => {
    if (!selected || templates.length <= 1) return;
    await removeStrictReviewTemplate(selected.id);
    setSelectedId(null);
  };

  const handleSetDefault = async () => {
    if (!selected) return;
    await setDefaultStrictReviewTemplate(selected.id);
  };

  const handleResetBody = () => {
    setDraft((prev) => ({ ...prev, template: DEFAULT_STRICT_REVIEW_TEMPLATE }));
    editorHandleRef.current?.setTemplateString(DEFAULT_STRICT_REVIEW_TEMPLATE);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl sm:max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
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

        <div className="flex min-h-0 flex-1 gap-4">
          <div className="flex w-52 shrink-0 flex-col gap-2 border-r pr-3">
            <div className="flex items-center justify-between">
              <Label>Templates</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                onClick={handleAdd}
              >
                <Plus className="size-3.5" />
                Add
              </Button>
            </div>
            <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
              {templates.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-sm transition-colors',
                    item.id === selected?.id
                      ? 'bg-secondary text-secondary-foreground'
                      : 'hover:bg-muted/50',
                  )}
                >
                  {item.isDefault && (
                    <Star className="size-3 shrink-0 fill-current text-amber-500" />
                  )}
                  <span className="truncate">{item.name}</span>
                </button>
              ))}
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex min-h-0 flex-1 flex-col gap-4"
          >
            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1">
              <div className="flex gap-3">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="template-name">Name</Label>
                  <Input
                    id="template-name"
                    value={draft.name}
                    onChange={(event) =>
                      setDraft((prev) => ({
                        ...prev,
                        name: event.target.value,
                      }))
                    }
                    placeholder="e.g. Mobile app"
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <Label htmlFor="template-url-pattern">URL pattern</Label>
                  <Input
                    id="template-url-pattern"
                    value={draft.urlPattern}
                    onChange={(event) =>
                      setDraft((prev) => ({
                        ...prev,
                        urlPattern: event.target.value,
                      }))
                    }
                    placeholder="e.g. group/project, !group/legacy"
                  />
                  <p className="text-[11px] text-muted-foreground">
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
                    <button
                      key={variable.key}
                      type="button"
                      onClick={() =>
                        editorHandleRef.current?.insertVariable(variable.key)
                      }
                      className="rounded-md border border-border bg-secondary px-2 py-1 text-xs font-mono text-secondary-foreground hover:bg-secondary/80 hover:border-primary/40 transition-colors"
                      title={variable.description}
                    >
                      {`{${variable.key}}`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 px-1">
                <Label>Template</Label>
                <TemplateVariableEditor
                  value={draft.template}
                  onChange={(next) =>
                    setDraft((prev) => ({ ...prev, template: next }))
                  }
                  variables={STRICT_REVIEW_TEMPLATE_VARIABLES}
                  handleRef={editorHandleRef}
                />
              </div>

              <div className="space-y-2 px-1">
                <Label>Preview</Label>
                <div className="max-h-40 overflow-auto rounded-md border bg-muted/30 p-3 text-xs whitespace-pre-wrap break-words font-mono leading-snug">
                  {previewTokens}
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 border-t pt-4 sm:justify-between">
              <div className="flex gap-2">
                {selected && !selected.isDefault && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleSetDefault}
                    disabled={isSaving}
                  >
                    <Star className="size-3.5" />
                    Set as default
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleResetBody}
                  disabled={isSaving}
                >
                  <RotateCcw className="size-3.5" />
                  Reset body
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleDelete}
                  disabled={isSaving || templates.length <= 1}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="size-3.5" />
                  Delete
                </Button>
              </div>
              <div className="flex gap-2">
                <DialogClose asChild>
                  <Button type="button" variant="outline" disabled={isSaving}>
                    Close
                  </Button>
                </DialogClose>
                <Button type="submit" disabled={isSaving || !isDirty}>
                  {isSaving && <Loader2 className="animate-spin" />}
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
